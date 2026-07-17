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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * 결제 보정 스케줄러
 *
 * PG 호출 결과가 불확실했거나, PG 성공 후 내부 처리가 실패한 주문을
 * 30초마다 토스 상태 조회 후 멱등적으로 완료 처리한다.
 *
 * TX 분리 구조:
 *   - claim / markDone / markFailed / reschedule → ReconciliationTxHelper (각각 독립 TX)
 *   - completeConfirm / completeCancel / recoverOrder  → PaymentTxHelper (각각 독립 TX)
 *   - 토스 API 호출 → TX 밖
 *
 * 한 번 실행에 최대 MAX_JOBS_PER_RUN건 처리하여 장애 후 적체를 빠르게 소화한다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ReconciliationScheduler {

    private static final int MAX_BACKOFF_SECONDS = 3600;
    private static final int MAX_JOBS_PER_RUN    = 50;

    private final ReconciliationTxHelper reconciliationTxHelper;
    private final PaymentTxHelper paymentTxHelper;
    private final PaymentMapper paymentMapper;
    private final TossPaymentClient tossPaymentClient;

    @Scheduled(fixedDelay = 30_000)
    public void process() {
        for (int i = 0; i < MAX_JOBS_PER_RUN; i++) {
            ReconciliationJob job = reconciliationTxHelper.claimNextJob();
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
    }

    private void processJob(ReconciliationJob job) {
        Order order = paymentMapper.findOrderById(job.getOrderId());
        if (order == null) {
            log.warn("보정 대상 주문 없음: jobId={}, orderId={}", job.getJobId(), job.getOrderId());
            reconciliationTxHelper.markFailed(job.getJobId(), job.getVersion(), "주문을 찾을 수 없음");
            return;
        }

        if (isAlreadyCompleted(order, job)) {
            log.info("보정 작업 이미 완료됨: jobId={}, orderStatus={}", job.getJobId(), order.getStatus());
            reconciliationTxHelper.markDone(job.getJobId(), job.getVersion());
            return;
        }

        // CONFIRM 잡: job.paymentKey 우선 사용 (payment 행 없이도 PG 조회 가능)
        // Legacy 잡(paymentKey 없음) 또는 CANCEL 잡: payment 테이블에서 조회
        String pgTxId = job.getPaymentKey() != null
                ? job.getPaymentKey()
                : paymentMapper.findPgTxIdByOrderId(job.getOrderId());

        if (pgTxId == null && JobOperation.CONFIRM.name().equals(job.getOperation())) {
            log.warn("CONFIRM 보정: pgTxId 없음 (PG 호출 전 실패) → PENDING 복구: jobId={}", job.getJobId());
            paymentTxHelper.recoverOrderToPending(job.getOrderId());
            return;
        }

        if (pgTxId == null) {
            reconciliationTxHelper.markFailed(job.getJobId(), job.getVersion(), "pgTxId 없음");
            return;
        }

        TossPaymentResponse pgState;
        try {
            pgState = tossPaymentClient.getPayment(pgTxId);
        } catch (TossUncertainException e) {
            log.warn("보정 작업 PG 상태 조회 불확실: jobId={}", job.getJobId(), e);
            reschedule(job, "PG 조회 불확실: " + e.getMessage());
            return;
        } catch (TossBusinessException e) {
            log.warn("보정 작업 PG 상태 조회 거절: jobId={}", job.getJobId(), e);
            reconciliationTxHelper.markFailed(job.getJobId(), job.getVersion(), "PG 조회 거절: " + e.getMessage());
            return;
        }

        if (JobOperation.CONFIRM.name().equals(job.getOperation())) {
            handleConfirmJob(job, order, pgTxId, pgState);
        } else {
            handleCancelJob(job, pgState);
        }
    }

    private void handleConfirmJob(ReconciliationJob job, Order order,
                                   String pgTxId, TossPaymentResponse pgState) {
        switch (pgState.getStatus()) {
            case "DONE" -> {
                // P2: PG 교차 검증 — 잘못 저장된 paymentKey·금액 불일치로 인한 오충전 방지
                if (!isConfirmPgStateValid(job, order, pgTxId, pgState)) {
                    reconciliationTxHelper.markFailed(job.getJobId(), job.getVersion(),
                            "PG 응답 교차 검증 실패 — 운영팀 확인 필요");
                    return;
                }
                try {
                    paymentTxHelper.completeConfirm(
                            order, pgTxId, pgState.getMethod(),
                            pgState.getTotalAmount(), pgState.getStatus());
                    // completeConfirm 내부에서 markDoneByOrderAndOperation 호출됨
                    log.info("보정 CONFIRM 완료: jobId={}, orderId={}", job.getJobId(), job.getOrderId());
                } catch (Exception e) {
                    log.error("보정 CONFIRM 내부 처리 실패: jobId={}", job.getJobId(), e);
                    reschedule(job, "내부 처리 실패: " + e.getMessage());
                }
            }
            case "ABORTED", "EXPIRED" -> {
                // recoverOrderToPending 내부에서 markDoneByOrderAndOperation 호출됨
                paymentTxHelper.recoverOrderToPending(job.getOrderId());
                log.info("보정 CONFIRM PG 거절 — PENDING 복구: jobId={}", job.getJobId());
            }
            default -> reschedule(job, "PG 상태 진행 중: " + pgState.getStatus());
        }
    }

    /**
     * P2: CONFIRM 보정 시 PG 응답 교차 검증
     * paymentKey·orderId·금액 불일치 시 자동 충전하지 않고 FAILED 처리
     */
    private boolean isConfirmPgStateValid(ReconciliationJob job, Order order,
                                           String pgTxId, TossPaymentResponse pgState) {
        if (!pgTxId.equals(pgState.getPaymentKey())) {
            log.error("보정 CONFIRM 교차 검증 실패 — paymentKey 불일치: jobId={}, expected={}, actual={}",
                    job.getJobId(), pgTxId, pgState.getPaymentKey());
            return false;
        }
        if (!order.getOrderUid().equals(pgState.getOrderId())) {
            log.error("보정 CONFIRM 교차 검증 실패 — orderId 불일치: jobId={}, expected={}, actual={}",
                    job.getJobId(), order.getOrderUid(), pgState.getOrderId());
            return false;
        }
        if (order.getPrice() != pgState.getTotalAmount()) {
            log.error("보정 CONFIRM 교차 검증 실패 — 금액 불일치: jobId={}, expected={}, actual={}",
                    job.getJobId(), order.getPrice(), pgState.getTotalAmount());
            return false;
        }
        return true;
    }

    private void handleCancelJob(ReconciliationJob job, TossPaymentResponse pgState) {
        switch (pgState.getStatus()) {
            case "CANCELED" -> {
                try {
                    paymentTxHelper.completeCancel(job.getOrderId());
                    reconciliationTxHelper.markDone(job.getJobId(), job.getVersion());
                    log.info("보정 CANCEL 완료: jobId={}, orderId={}", job.getJobId(), job.getOrderId());
                } catch (Exception e) {
                    log.error("보정 CANCEL 내부 처리 실패: jobId={}", job.getJobId(), e);
                    reschedule(job, "내부 처리 실패: " + e.getMessage());
                }
            }
            case "PARTIAL_CANCELED" -> {
                // P2: 부분 취소는 미지원 — 운영팀 수동 처리 대상
                // 예약금은 해제하고 PAID로 복구하여 주문 고착 방지
                log.error("보정 CANCEL PARTIAL_CANCELED 미지원 — 운영팀 확인 필요: jobId={}, orderId={}",
                        job.getJobId(), job.getOrderId());
                reconciliationTxHelper.markFailed(job.getJobId(), job.getVersion(),
                        "PARTIAL_CANCELED 미지원 — 운영팀 확인 필요");
                try {
                    paymentTxHelper.recoverOrderToPaid(job.getOrderId());
                } catch (Exception e) {
                    log.error("PARTIAL_CANCELED PAID 복구 실패 — 예약금 수동 해제 필요: jobId={}", job.getJobId(), e);
                }
            }
            case "DONE" -> {
                // 취소 명시 거절 (PG는 여전히 DONE) → PAID 복구
                // recoverOrderToPaid 내부에서 markDoneByOrderAndOperation 호출됨
                paymentTxHelper.recoverOrderToPaid(job.getOrderId());
                log.info("보정 CANCEL PG 거절 — PAID 복구: jobId={}", job.getJobId());
            }
            default -> reschedule(job, "PG 상태 진행 중: " + pgState.getStatus());
        }
    }

    private boolean isAlreadyCompleted(Order order, ReconciliationJob job) {
        if (JobOperation.CONFIRM.name().equals(job.getOperation())) {
            return OrderStatus.PAID.name().equals(order.getStatus());
        }
        return OrderStatus.CANCELED.name().equals(order.getStatus());
    }

    private void reschedule(ReconciliationJob job, String error) {
        int newRetry = job.getRetryCount() + 1;
        if (newRetry > job.getMaxRetries()) {
            // 재시도 경로는 PG 상태가 불확실한 케이스 (TossUncertainException, 진행 중 상태 등)
            // CANCEL 잡이라도 PG가 실제로 취소 완료했을 수 있으므로 자동 PAID 복구하지 않음
            // → 복구 시 PG=CANCELED, DB=PAID 불일치 위험
            // 운영팀이 PG 원장 대조 후 수동 처리해야 함
            log.error("보정 작업 최대 재시도 초과 — 운영팀 수동 처리 필요: jobId={}, operation={}, orderId={}, lastError={}",
                    job.getJobId(), job.getOperation(), job.getOrderId(), error);
            reconciliationTxHelper.markFailed(job.getJobId(), job.getVersion(), "최대 재시도 초과: " + error);
            return;
        }
        long backoffSec = Math.min((long) Math.pow(2, newRetry) * 30L, MAX_BACKOFF_SECONDS);
        LocalDateTime next = LocalDateTime.now().plusSeconds(backoffSec);
        reconciliationTxHelper.reschedule(job.getJobId(), job.getVersion(), newRetry, next, error);
        log.info("보정 작업 재스케줄: jobId={}, retryCount={}, next={}", job.getJobId(), newRetry, next);
    }
}
