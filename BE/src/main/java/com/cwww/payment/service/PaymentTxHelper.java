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

    /** ① 주문 검증 + CONFIRMING 전이 (짧은 TX) */
    @Transactional
    public Order validateAndTransitionToConfirming(Long userId, String orderUid, int requestAmount) {
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
        return order;
    }

    /** ③ PG 승인 성공 후 내부 완료 처리 — 멱등 (짧은 TX) */
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
            // 최초 처리 → 지갑 충전
            paymentMapper.addWalletBalance(order.getUserId(), order.getAcornAmount());
        }
        // inserted == 0 이면 이전 처리에서 이미 충전됨 → 스킵

        // payment 멱등 삽입
        paymentMapper.insertPaymentIdempotent(
                order.getOrderId(), pgTxId, method, totalAmount, pgStatus, order.getUserId());

        // PAID 전이 (CONFIRMING → PAID, 이미 PAID이면 CAS가 no-op)
        paymentMapper.updateOrderStatusCas(
                order.getOrderId(), OrderStatus.CONFIRMING.name(), OrderStatus.PAID.name());

        AcornWallet updated = paymentMapper.findWalletByUserId(order.getUserId());
        return PaymentConfirmResponse.builder()
                .orderUid(order.getOrderUid())
                .chargedAcorn(order.getAcornAmount())
                .balance(updated.getBalance())
                .build();
    }

    /** PG 명시 거절 시 주문 PENDING 복구 */
    @Transactional
    public void recoverOrderToPending(Long orderId) {
        paymentMapper.updateOrderStatusCas(orderId, OrderStatus.CONFIRMING.name(), OrderStatus.PENDING.name());
    }

    /** 보정 작업 생성 (CONFIRM) */
    @Transactional
    public void saveConfirmJob(Long orderId) {
        reconciliationJobMapper.insertJob(ReconciliationJob.builder()
                .orderId(orderId)
                .operation(JobOperation.CONFIRM.name())
                .maxRetries(5)
                .build());
    }

    // ──────────────────────────────────────────────────────────────────────
    // CANCEL 흐름
    // ──────────────────────────────────────────────────────────────────────

    /** ① 주문 검증 + CANCELING 전이 + 보정 작업 생성 (짧은 TX) */
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

        // 보정 작업을 먼저 생성 → PG 취소 성공 후 내부 처리 실패해도 스케줄러가 복구
        reconciliationJobMapper.insertJob(ReconciliationJob.builder()
                .orderId(order.getOrderId())
                .operation(JobOperation.CANCEL.name())
                .maxRetries(5)
                .build());

        return order;
    }

    /** ③ PG 취소 성공 후 내부 완료 처리 — 멱등 (짧은 TX) */
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
        int balanceAfter = wallet.getBalance() - order.getAcornAmount();

        // REFUND 원장 멱등 삽입 — 반환값으로 지갑 이중 차감 방지
        int inserted = paymentMapper.insertAcornTransactionIdempotent(
                order.getUserId(), -order.getAcornAmount(), balanceAfter,
                AcornTxReason.REFUND.name(), order.getOrderId());

        if (inserted > 0) {
            paymentMapper.addWalletBalance(order.getUserId(), -order.getAcornAmount());
        }

        paymentMapper.updatePaymentPgStatus(orderId, "CANCELED", null);
        paymentMapper.updateOrderStatusCas(
                orderId, OrderStatus.CANCELING.name(), OrderStatus.CANCELED.name());

        AcornWallet updated = paymentMapper.findWalletByUserId(order.getUserId());
        return PaymentCancelResponse.builder()
                .orderUid(order.getOrderUid())
                .refundedAcorn(order.getAcornAmount())
                .balance(updated.getBalance())
                .build();
    }

    /** PG 취소 명시 거절 시 주문 PAID 복구 */
    @Transactional
    public void recoverOrderToPaid(Long orderId) {
        paymentMapper.updateOrderStatusCas(orderId, OrderStatus.CANCELING.name(), OrderStatus.PAID.name());
    }
}
