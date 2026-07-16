package com.cwww.payment.service;

import com.cwww.global.exception.BusinessException;
import com.cwww.global.exception.ErrorCode;
import com.cwww.payment.domain.*;
import com.cwww.payment.dto.PaymentCancelResponse;
import com.cwww.payment.dto.PaymentConfirmResponse;
import com.cwww.payment.mapper.PaymentMapper;
import com.cwww.payment.mapper.ReconciliationJobMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * 결제 흐름에서 DB 트랜잭션이 필요한 짧은 작업들을 모아둔 컴포넌트.
 * PaymentServiceImpl / ReconciliationScheduler 에서 PG 호출 전·후에 호출한다.
 *
 * Spring AOP는 같은 클래스 내 self-invocation에 @Transactional을 적용하지 못하므로
 * 별도 빈으로 분리한다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentTxHelper {

    private final PaymentMapper paymentMapper;
    private final ReconciliationJobMapper reconciliationJobMapper;

    // ──────────────────────────────────────────────────────────────────────
    // CONFIRM 흐름
    // ──────────────────────────────────────────────────────────────────────

    /**
     * ① 주문 검증 + CONFIRMING 전이 + CONFIRM 보정 작업 선생성 (짧은 TX)
     *
     * paymentKey를 보정 작업에 함께 저장하여, PG 호출 직후 프로세스가 죽어도
     * 스케줄러가 payment 행 없이 직접 PG를 조회할 수 있다.
     */
    @Transactional
    public Order validateAndTransitionToConfirming(Long userId, String orderUid,
                                                    int requestAmount, String paymentKey) {
        Order order = paymentMapper.findOrderByUidForUpdate(orderUid);
        if (order == null) throw new BusinessException(ErrorCode.ORDER_NOT_FOUND);
        if (!order.getUserId().equals(userId)) throw new BusinessException(ErrorCode.FORBIDDEN);

        String status = order.getStatus();
        if (OrderStatus.CONFIRMING.name().equals(status)
                || OrderStatus.CANCELING.name().equals(status)) {
            throw new BusinessException(ErrorCode.ORDER_IN_PROGRESS);
        }
        if (!OrderStatus.PENDING.name().equals(status)) {
            throw new BusinessException(ErrorCode.ALREADY_PROCESSED_ORDER);
        }
        if (order.getPrice() != requestAmount) {
            throw new BusinessException(ErrorCode.AMOUNT_MISMATCH);
        }

        paymentMapper.updateOrderStatus(order.getOrderId(), OrderStatus.CONFIRMING.name());

        // CONFIRM 보정 작업 선생성 (paymentKey 포함) — ON CONFLICT DO NOTHING으로 멱등 처리
        // nextAttemptAt: 60초 후 — PG 호출 완료 전 스케줄러가 선점해 PENDING 복구하는 경쟁 방지
        reconciliationJobMapper.insertJob(ReconciliationJob.builder()
                .orderId(order.getOrderId())
                .operation(JobOperation.CONFIRM.name())
                .paymentKey(paymentKey)
                .maxRetries(5)
                .nextAttemptAt(LocalDateTime.now().plusSeconds(60))
                .build());

        return order;
    }

    /**
     * ③ PG 승인 성공 후 내부 완료 처리 — 멱등 (짧은 TX)
     *
     * CAS(CONFIRMING→PAID) 반환값을 검증하여 예상치 못한 상태 전이를 차단한다.
     * 모든 처리 완료 후 보정 작업을 DONE 처리한다.
     */
    @Transactional
    public PaymentConfirmResponse completeConfirm(Order order,
                                                   String pgTxId, String method,
                                                   int totalAmount, String pgStatus) {
        // 지갑 생성 (신규 사용자 동시 첫 결제 race condition: ON CONFLICT DO NOTHING)
        paymentMapper.upsertWallet(order.getUserId());

        // 지갑 잠금
        AcornWallet wallet = paymentMapper.findWalletForUpdate(order.getUserId());
        int balanceAfter = wallet.getBalance() + order.getAcornAmount();

        // CHARGE 원장 멱등 삽입 — 반환값으로 지갑 이중 충전 방지
        int inserted = paymentMapper.insertAcornTransactionIdempotent(
                order.getUserId(), order.getAcornAmount(), balanceAfter,
                AcornTxReason.CHARGE.name(), order.getOrderId());

        if (inserted > 0) {
            paymentMapper.addWalletBalance(order.getUserId(), order.getAcornAmount());
        }

        // payment 멱등 삽입
        paymentMapper.insertPaymentIdempotent(
                order.getOrderId(), pgTxId, method, totalAmount, pgStatus, order.getUserId());

        // PAID 전이 — CAS 반환값 검증
        int cas = paymentMapper.updateOrderStatusCas(
                order.getOrderId(), OrderStatus.CONFIRMING.name(), OrderStatus.PAID.name());
        if (cas == 0) {
            // 이미 PAID이면 멱등 처리, 그 외는 예상 불가 상태 → 예외
            Order current = paymentMapper.findOrderById(order.getOrderId());
            if (current == null || !OrderStatus.PAID.name().equals(current.getStatus())) {
                throw new BusinessException(ErrorCode.ALREADY_PROCESSED_ORDER);
            }
        }

        // 보정 작업 완료 처리 (CONFIRM 잡)
        reconciliationJobMapper.markDoneByOrderAndOperation(
                order.getOrderId(), JobOperation.CONFIRM.name());

        AcornWallet updated = paymentMapper.findWalletByUserId(order.getUserId());
        return PaymentConfirmResponse.builder()
                .orderUid(order.getOrderUid())
                .chargedAcorn(order.getAcornAmount())
                .balance(updated.getBalance())
                .build();
    }

    /**
     * PG 명시 거절 시 주문 PENDING 복구 + 보정 작업 종료 (짧은 TX)
     * CONFIRM 보정 잡을 동시에 닫아 스케줄러 불필요한 재처리를 방지한다.
     */
    @Transactional
    public void recoverOrderToPending(Long orderId) {
        paymentMapper.updateOrderStatusCas(orderId, OrderStatus.CONFIRMING.name(), OrderStatus.PENDING.name());
        reconciliationJobMapper.markDoneByOrderAndOperation(orderId, JobOperation.CONFIRM.name());
    }

    // ──────────────────────────────────────────────────────────────────────
    // CANCEL 흐름
    // ──────────────────────────────────────────────────────────────────────

    /**
     * ① 주문 검증 + CANCELING 전이 + 보정 작업 생성 (짧은 TX)
     *
     * CANCEL 보정 작업의 next_attempt_at을 60초 후로 설정하여
     * PG 취소 호출이 진행 중인 동안 스케줄러가 선점하는 레이스를 방지한다.
     */
    @Transactional
    public Order validateAndTransitionToCanceling(Long userId, String orderUid) {
        Order order = paymentMapper.findOrderByUidForUpdate(orderUid);
        if (order == null) throw new BusinessException(ErrorCode.ORDER_NOT_FOUND);
        if (!order.getUserId().equals(userId)) throw new BusinessException(ErrorCode.FORBIDDEN);

        String status = order.getStatus();
        if (OrderStatus.CONFIRMING.name().equals(status)
                || OrderStatus.CANCELING.name().equals(status)) {
            throw new BusinessException(ErrorCode.ORDER_IN_PROGRESS);
        }
        if (!OrderStatus.PAID.name().equals(status)) {
            throw new BusinessException(ErrorCode.CANCEL_NOT_ALLOWED);
        }

        AcornWallet wallet = paymentMapper.findWalletForUpdate(order.getUserId());
        if (wallet == null || wallet.getBalance() < order.getAcornAmount()) {
            throw new BusinessException(ErrorCode.REFUND_INSUFFICIENT_BALANCE);
        }

        paymentMapper.updateOrderStatus(order.getOrderId(), OrderStatus.CANCELING.name());

        // PG 취소 호출 타임아웃(30s) + 버퍼를 고려해 60초 후 실행
        reconciliationJobMapper.insertJob(ReconciliationJob.builder()
                .orderId(order.getOrderId())
                .operation(JobOperation.CANCEL.name())
                .maxRetries(5)
                .nextAttemptAt(LocalDateTime.now().plusSeconds(60))
                .build());

        return order;
    }

    /**
     * ③ PG 취소 성공 후 내부 완료 처리 — 멱등 (짧은 TX)
     *
     * PG 취소와 내부 처리 사이에 사용자가 도토리를 소비했을 수 있으므로
     * 지갑 잔액을 재검증한 후 차감한다.
     */
    @Transactional
    public PaymentCancelResponse completeCancel(Long orderId) {
        Order order = paymentMapper.findOrderByIdForUpdate(orderId);
        if (order == null) throw new BusinessException(ErrorCode.ORDER_NOT_FOUND);

        // 이미 CANCELED이면 멱등 응답
        if (OrderStatus.CANCELED.name().equals(order.getStatus())) {
            AcornWallet w = paymentMapper.findWalletByUserId(order.getUserId());
            return PaymentCancelResponse.builder()
                    .orderUid(order.getOrderUid())
                    .refundedAcorn(order.getAcornAmount())
                    .balance(w != null ? w.getBalance() : 0)
                    .build();
        }

        paymentMapper.upsertWallet(order.getUserId());
        AcornWallet wallet = paymentMapper.findWalletForUpdate(order.getUserId());

        // 잔액 재검증 — validateAndTransitionToCanceling 이후 도토리를 소비했을 수 있음
        if (wallet.getBalance() < order.getAcornAmount()) {
            log.error("환불 잔액 부족 — CANCELING 유지, 운영팀 개입 필요: orderId={}, balance={}, required={}",
                    orderId, wallet.getBalance(), order.getAcornAmount());
            throw new BusinessException(ErrorCode.REFUND_INSUFFICIENT_BALANCE);
        }

        int balanceAfter = wallet.getBalance() - order.getAcornAmount();

        // REFUND 원장 멱등 삽입 — 반환값으로 지갑 이중 차감 방지
        int inserted = paymentMapper.insertAcornTransactionIdempotent(
                order.getUserId(), -order.getAcornAmount(), balanceAfter,
                AcornTxReason.REFUND.name(), order.getOrderId());

        if (inserted > 0) {
            paymentMapper.addWalletBalance(order.getUserId(), -order.getAcornAmount());
        }

        paymentMapper.updatePaymentPgStatus(orderId, "CANCELED", null);

        // CANCELED 전이 — CAS 반환값 검증
        int cas = paymentMapper.updateOrderStatusCas(
                orderId, OrderStatus.CANCELING.name(), OrderStatus.CANCELED.name());
        if (cas == 0) {
            Order current = paymentMapper.findOrderById(orderId);
            if (current == null || !OrderStatus.CANCELED.name().equals(current.getStatus())) {
                throw new BusinessException(ErrorCode.CANCEL_NOT_ALLOWED);
            }
        }

        AcornWallet updated = paymentMapper.findWalletByUserId(order.getUserId());
        return PaymentCancelResponse.builder()
                .orderUid(order.getOrderUid())
                .refundedAcorn(order.getAcornAmount())
                .balance(updated.getBalance())
                .build();
    }

    /**
     * PG 취소 명시 거절 시 주문 PAID 복구 + 보정 작업 종료 (짧은 TX)
     * pgTxId 없음(PG 호출 전 실패)으로 인한 복구 시에도 동일하게 사용한다.
     */
    @Transactional
    public void recoverOrderToPaid(Long orderId) {
        paymentMapper.updateOrderStatusCas(orderId, OrderStatus.CANCELING.name(), OrderStatus.PAID.name());
        reconciliationJobMapper.markDoneByOrderAndOperation(orderId, JobOperation.CANCEL.name());
    }
}
