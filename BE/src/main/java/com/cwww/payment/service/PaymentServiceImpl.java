package com.cwww.payment.service;

import com.cwww.global.exception.BusinessException;
import com.cwww.global.exception.ErrorCode;
import com.cwww.payment.client.TossBusinessException;
import com.cwww.payment.client.TossCancelResponse;
import com.cwww.payment.client.TossConfirmResponse;
import com.cwww.payment.client.TossPaymentClient;
import com.cwww.payment.client.TossUncertainException;
import com.cwww.payment.domain.AcornWallet;
import com.cwww.payment.domain.Order;
import com.cwww.payment.domain.OrderStatus;
import com.cwww.payment.dto.*;
import com.cwww.payment.mapper.PaymentMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private static final int ACORN_UNIT         = 100;
    private static final int PRICE_PER_UNIT     = 1000;
    private static final int MAX_ACORN_PER_ORDER = 10000;
    private static final int MAX_PAGE_SIZE       = 100;

    private final PaymentMapper paymentMapper;
    private final TossPaymentClient tossPaymentClient;
    private final PaymentTxHelper paymentTxHelper;

    @Override
    @Transactional
    public OrderCreateResponse createOrder(Long userId, int acornAmount) {
        if (userId == null) throw new BusinessException(ErrorCode.FORBIDDEN);
        if (acornAmount < ACORN_UNIT
                || acornAmount % ACORN_UNIT != 0
                || acornAmount > MAX_ACORN_PER_ORDER) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }

        int price    = (acornAmount / ACORN_UNIT) * PRICE_PER_UNIT;
        String uid   = UUID.randomUUID().toString();

        Order order  = Order.builder()
                .userId(userId)
                .acornAmount(acornAmount)
                .price(price)
                .status(OrderStatus.PENDING.name())
                .orderUid(uid)
                .build();
        paymentMapper.insertOrder(order);

        return OrderCreateResponse.builder()
                .orderUid(uid)
                .acornAmount(acornAmount)
                .price(price)
                .build();
    }

    /**
     * 결제 승인 — 내구성 있는 3단계 흐름
     *
     * 1) [짧은 TX] 검증 + CONFIRMING 전이 + CONFIRM 보정 작업 선생성(paymentKey 포함)
     * 2) [TX 밖]  토스 승인 API 호출
     * 3) [짧은 TX] 내부 완료 처리 + 보정 작업 DONE 처리 (멱등)
     *
     * 2에서 불확실한 오류 → CONFIRMING 유지, 보정 작업이 이미 있으므로 스케줄러가 복구
     * 2에서 PG 명시 거절  → PENDING 복구 + 보정 작업 DONE
     * 3에서 실패          → 보정 작업이 이미 있으므로 스케줄러가 복구
     */
    @Override
    public PaymentConfirmResponse confirmPayment(Long userId, PaymentConfirmRequest request) {
        // ① 검증 + CONFIRMING 전이 + CONFIRM 보정 작업 선생성
        Order order = paymentTxHelper.validateAndTransitionToConfirming(
                userId, request.getOrderUid(), request.getAmount(), request.getPaymentKey());

        // ② 토스 승인 (트랜잭션 밖)
        TossConfirmResponse toss;
        try {
            toss = tossPaymentClient.confirm(
                    request.getPaymentKey(), request.getOrderUid(), request.getAmount());
        } catch (TossBusinessException e) {
            log.warn("PG 명시 거절 — 주문 PENDING 복구: orderId={}, pgCode={}",
                    order.getOrderId(), e.getErrorCode());
            paymentTxHelper.recoverOrderToPending(order.getOrderId());
            throw new BusinessException(ErrorCode.PAYMENT_PG_REJECTED);
        } catch (TossUncertainException e) {
            log.warn("PG 결과 불확실 — CONFIRMING 유지, 보정 작업 스케줄러에 위임: orderId={}", order.getOrderId(), e);
            throw new BusinessException(ErrorCode.PAYMENT_CONFIRM_FAILED);
        }

        // ③ 응답 검증
        validateConfirmResponse(toss, request.getPaymentKey(), request.getOrderUid(), request.getAmount());

        // ④ 내부 완료 처리 (보정 작업 DONE 처리 포함)
        try {
            return paymentTxHelper.completeConfirm(
                    order, toss.getPaymentKey(), toss.getMethod(),
                    toss.getTotalAmount(), toss.getStatus());
        } catch (Exception e) {
            log.error("PG 승인 성공 후 내부 처리 실패 — 보정 스케줄러에 위임: orderId={}", order.getOrderId(), e);
            throw new BusinessException(ErrorCode.PAYMENT_CONFIRM_FAILED);
        }
    }

    /**
     * 결제 취소 — 내구성 있는 3단계 흐름
     *
     * 1) [짧은 TX] 검증 + CANCELING 전이 + 보정 작업 생성 (60초 후 실행)
     * 2) [TX 밖]  토스 취소 API 호출 + 응답 검증
     * 3) [짧은 TX] 내부 완료 처리 — 잔액 재검증 포함 (멱등)
     *
     * 2에서 불확실한 오류 → CANCELING 유지, 보정 작업 스케줄러가 60초 후 재시도
     * 2에서 PG 명시 거절  → PAID 복구 + 보정 작업 DONE
     * 3에서 실패          → 보정 작업이 이미 있으므로 스케줄러가 복구
     */
    @Override
    public PaymentCancelResponse cancelPayment(Long userId, PaymentCancelRequest request) {
        // ① 검증 + CANCELING 전이 + 보정 작업 생성
        Order order = paymentTxHelper.validateAndTransitionToCanceling(userId, request.getOrderUid());

        // ② pgTxId 조회 (TX 밖)
        String pgTxId = paymentMapper.findPgTxIdByOrderId(order.getOrderId());
        if (pgTxId == null) {
            // payment 행 없음 → PG 호출 전 또는 payment INSERT 실패 → PAID 복구 + 보정 작업 종료
            log.error("pgTxId 없음 — PAID 복구: orderId={}", order.getOrderId());
            paymentTxHelper.recoverOrderToPaid(order.getOrderId());
            throw new BusinessException(ErrorCode.PAYMENT_NOT_FOUND);
        }

        String reason = (request.getReason() == null || request.getReason().isBlank())
                ? "사용자 요청 취소" : request.getReason();

        // ③ 토스 취소 (트랜잭션 밖)
        TossCancelResponse cancelResp;
        try {
            cancelResp = tossPaymentClient.cancel(pgTxId, reason);
        } catch (TossBusinessException e) {
            log.warn("PG 취소 명시 거절 — PAID 복구: orderId={}, pgCode={}",
                    order.getOrderId(), e.getErrorCode());
            paymentTxHelper.recoverOrderToPaid(order.getOrderId());
            throw new BusinessException(ErrorCode.PAYMENT_CANCEL_FAILED);
        } catch (TossUncertainException e) {
            log.warn("PG 취소 결과 불확실 — CANCELING 유지, 보정 스케줄러에 위임: orderId={}",
                    order.getOrderId(), e);
            throw new BusinessException(ErrorCode.PAYMENT_CANCEL_FAILED);
        }

        // ④ 취소 응답 검증
        validateCancelResponse(cancelResp, pgTxId, order.getOrderId());

        // ⑤ 내부 완료 처리
        try {
            return paymentTxHelper.completeCancel(order.getOrderId());
        } catch (Exception e) {
            log.error("PG 취소 성공 후 내부 처리 실패 — 보정 스케줄러에 위임: orderId={}",
                    order.getOrderId(), e);
            throw new BusinessException(ErrorCode.PAYMENT_CANCEL_FAILED);
        }
    }

    @Override
    public List<AcornHistoryResponse> getAcornHistory(Long userId, int page, int size) {
        if (page < 1 || size < 1 || size > MAX_PAGE_SIZE) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
        long offset = (long) (page - 1) * size;
        return paymentMapper.findAcornHistory(userId, size, offset);
    }

    @Override
    public AcornBalanceResponse getBalance(Long userId) {
        AcornWallet wallet = paymentMapper.findWalletByUserId(userId);
        int balance = (wallet == null) ? 0 : wallet.getBalance();
        return AcornBalanceResponse.builder().balance(balance).build();
    }

    // ──────────────────────────────────────────────────────────────────────

    private void validateConfirmResponse(TossConfirmResponse toss,
                                          String expectedPaymentKey,
                                          String expectedOrderUid,
                                          int expectedAmount) {
        if (!"DONE".equals(toss.getStatus())) {
            throw new TossBusinessException("NOT_DONE", "토스 승인 상태가 DONE이 아님: " + toss.getStatus());
        }
        if (!expectedPaymentKey.equals(toss.getPaymentKey())) {
            throw new TossBusinessException("PAYMENT_KEY_MISMATCH", "paymentKey 불일치");
        }
        if (!expectedOrderUid.equals(toss.getOrderId())) {
            throw new TossBusinessException("ORDER_ID_MISMATCH", "orderId 불일치");
        }
        if (toss.getTotalAmount() != expectedAmount) {
            throw new TossBusinessException("AMOUNT_MISMATCH",
                    "금액 불일치: expected=" + expectedAmount + ", actual=" + toss.getTotalAmount());
        }
    }

    private void validateCancelResponse(TossCancelResponse resp, String expectedPgTxId, Long orderId) {
        if (resp == null) {
            log.warn("토스 취소 응답 null — 보정 스케줄러에 위임: orderId={}", orderId);
            throw new TossUncertainException("취소 응답 null", null);
        }
        if (!"CANCELED".equals(resp.getStatus()) && !"PARTIAL_CANCELED".equals(resp.getStatus())) {
            log.warn("토스 취소 응답 상태 이상 — 보정 스케줄러에 위임: orderId={}, status={}",
                    orderId, resp.getStatus());
            throw new TossUncertainException("취소 응답 상태 이상: " + resp.getStatus(), null);
        }
        if (!expectedPgTxId.equals(resp.getPaymentKey())) {
            log.warn("토스 취소 응답 paymentKey 불일치: expected={}, actual={}", expectedPgTxId, resp.getPaymentKey());
            throw new TossUncertainException("paymentKey 불일치", null);
        }
    }
}
