package com.cwww.payment.service;

import com.cwww.payment.client.TossBusinessException;
import com.cwww.payment.client.TossPaymentClient;
import com.cwww.payment.client.TossPaymentResponse;
import com.cwww.payment.client.TossUncertainException;
import com.cwww.payment.domain.JobOperation;
import com.cwww.payment.domain.Order;
import com.cwww.payment.domain.OrderStatus;
import com.cwww.payment.domain.ReconciliationJob;
import com.cwww.payment.mapper.PaymentMapper;
import com.cwww.payment.mapper.ReconciliationJobMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * 결제 보정 스케줄러
 *
 * PG 호출 결과가 불확실했거나, PG 성공 후 내부 처리가 실패한 주문을
 * 30초마다 토스 상태 조회 후 멱등적으로 완료 처리한다.
 *
 * 다중 인스턴스 환경: FOR UPDATE SKIP LOCKED + lockedAt soft lock 으로 중복 실행 방지
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ReconciliationScheduler {

    private static final int MAX_BACKOFF_SECONDS = 3600; // 최대 1시간

    private final ReconciliationJobMapper reconciliationJobMapper;
    private final PaymentMapper paymentMapper;
    private final TossPaymentClient tossPaymentClient;
    private final PaymentTxHelper paymentTxHelper;

    @Scheduled(fixedDelay = 30_000)
    public void process() {
        ReconciliationJob job = claimNextJob();
        if (job == null) return;

        log.info("보정 작업 처리 시작: jobId={}, orderId={}, operation={}",
                job.getJobId(), job.getOrderId(), job.getOperation());
        try {
            processJob(job);
        } catch (Exception e) {
            log.error("보정 작업 처리 중 예외: jobId={}", job.getJobId(), e);
            reschedule(job, e.getMessage());
        }
    }

    /** FOR UPDATE SKIP LOCKED — 다중 인스턴스에서 한 작업을 한 번만 처리 */
    @Transactional
    protected ReconciliationJob claimNextJob() {
        ReconciliationJob job = reconciliationJobMapper.claimNextJob();
        if (job != null) {
            reconciliationJobMapper.markProcessing(job.getJobId());
        }
        return job;
    }

    private void processJob(ReconciliationJob job) {
        Order order = paymentMapper.findOrderById(job.getOrderId());
        if (order == null) {
            log.warn("보정 대상 주문 없음: jobId={}, orderId={}", job.getJobId(), job.getOrderId());
            markJobFailed(job, "주문을 찾을 수 없음");
            return;
        }

        // 이미 최종 상태이면 완료 처리
        if (isAlreadyCompleted(order, job)) {
            log.info("보정 작업 이미 완료됨: jobId={}, orderStatus={}", job.getJobId(), order.getStatus());
            markJobDone(job);
            return;
        }

        String pgTxId = paymentMapper.findPgTxIdByOrderId(job.getOrderId());

        if (pgTxId == null && JobOperation.CONFIRM.name().equals(job.getOperation())) {
            // PG 승인 API 호출 전에 실패한 경우 (pgTxId 자체가 없음) → PENDING 복구
            log.warn("CONFIRM 보정: pgTxId 없음 (PG 호출 전 실패) → PENDING 복구: jobId={}", job.getJobId());
            paymentTxHelper.recoverOrderToPending(job.getOrderId());
            markJobDone(job);
            return;
        }

        if (pgTxId == null) {
            markJobFailed(job, "pgTxId 없음");
            return;
        }

        // 토스 상태 조회
        TossPaymentResponse pgState;
        try {
            pgState = tossPaymentClient.getPayment(pgTxId);
        } catch (TossUncertainException e) {
            log.warn("보정 작업 PG 상태 조회 불확실: jobId={}", job.getJobId(), e);
            reschedule(job, "PG 조회 불확실: " + e.getMessage());
            return;
        } catch (TossBusinessException e) {
            log.warn("보정 작업 PG 상태 조회 거절: jobId={}", job.getJobId(), e);
            markJobFailed(job, "PG 조회 거절: " + e.getMessage());
            return;
        }

        if (JobOperation.CONFIRM.name().equals(job.getOperation())) {
            handleConfirmJob(job, order, pgTxId, pgState);
        } else {
            handleCancelJob(job, order, pgState);
        }
    }

    private void handleConfirmJob(ReconciliationJob job, Order order,
                                   String pgTxId, TossPaymentResponse pgState) {
        switch (pgState.getStatus()) {
            case "DONE" -> {
                try {
                    paymentTxHelper.completeConfirm(
                            order, pgTxId, pgState.getMethod(),
                            pgState.getTotalAmount(), pgState.getStatus());
                    markJobDone(job);
                    log.info("보정 CONFIRM 완료: jobId={}, orderId={}", job.getJobId(), job.getOrderId());
                } catch (Exception e) {
                    log.error("보정 CONFIRM 내부 처리 실패: jobId={}", job.getJobId(), e);
                    reschedule(job, "내부 처리 실패: " + e.getMessage());
                }
            }
            case "ABORTED", "EXPIRED" -> {
                // PG 최종 거절 → PENDING 복구
                paymentTxHelper.recoverOrderToPending(job.getOrderId());
                markJobDone(job);
                log.info("보정 CONFIRM PG 거절 — PENDING 복구: jobId={}", job.getJobId());
            }
            default ->
                // READY, IN_PROGRESS 등 진행 중 → 재시도
                reschedule(job, "PG 상태 진행 중: " + pgState.getStatus());
        }
    }

    private void handleCancelJob(ReconciliationJob job, Order order, TossPaymentResponse pgState) {
        switch (pgState.getStatus()) {
            case "CANCELED", "PARTIAL_CANCELED" -> {
                try {
                    paymentTxHelper.completeCancel(job.getOrderId());
                    markJobDone(job);
                    log.info("보정 CANCEL 완료: jobId={}, orderId={}", job.getJobId(), job.getOrderId());
                } catch (Exception e) {
                    log.error("보정 CANCEL 내부 처리 실패: jobId={}", job.getJobId(), e);
                    reschedule(job, "내부 처리 실패: " + e.getMessage());
                }
            }
            case "DONE" -> {
                // 취소 명시 거절 (PG는 여전히 DONE) → PAID 복구
                paymentTxHelper.recoverOrderToPaid(job.getOrderId());
                markJobDone(job);
                log.info("보정 CANCEL PG 거절 — PAID 복구: jobId={}", job.getJobId());
            }
            default ->
                reschedule(job, "PG 상태 진행 중: " + pgState.getStatus());
        }
    }

    private boolean isAlreadyCompleted(Order order, ReconciliationJob job) {
        if (JobOperation.CONFIRM.name().equals(job.getOperation())) {
            return OrderStatus.PAID.name().equals(order.getStatus());
        }
        return OrderStatus.CANCELED.name().equals(order.getStatus());
    }

    @Transactional
    protected void markJobDone(ReconciliationJob job) {
        reconciliationJobMapper.markDone(job.getJobId());
    }

    @Transactional
    protected void markJobFailed(ReconciliationJob job, String error) {
        reconciliationJobMapper.markFailed(job.getJobId(), error);
    }

    @Transactional
    protected void reschedule(ReconciliationJob job, String error) {
        int newRetry = job.getRetryCount() + 1;
        if (newRetry > job.getMaxRetries()) {
            log.error("보정 작업 최대 재시도 초과: jobId={}, lastError={}", job.getJobId(), error);
            reconciliationJobMapper.markFailed(job.getJobId(), "최대 재시도 초과: " + error);
            return;
        }
        long backoffSec = Math.min((long) Math.pow(2, newRetry) * 30L, MAX_BACKOFF_SECONDS);
        LocalDateTime next = LocalDateTime.now().plusSeconds(backoffSec);
        reconciliationJobMapper.reschedule(job.getJobId(), newRetry, next, error);
        log.info("보정 작업 재스케줄: jobId={}, retryCount={}, nextAttempt={}", job.getJobId(), newRetry, next);
    }
}
