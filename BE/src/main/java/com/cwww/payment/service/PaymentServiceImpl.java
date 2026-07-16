package com.cwww.payment.service;

import com.cwww.global.exception.BusinessException;
import com.cwww.global.exception.ErrorCode;
import com.cwww.payment.client.TossConfirmResponse;
import com.cwww.payment.client.TossPaymentClient;
import com.cwww.payment.domain.AcornTxReason;
import com.cwww.payment.domain.AcornWallet;
import com.cwww.payment.domain.Order;
import com.cwww.payment.domain.OrderStatus;
import com.cwww.payment.dto.*;
import com.cwww.payment.mapper.PaymentMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private static final int ACORN_UNIT = 100;      // 판매 단위: 100개
    private static final int PRICE_PER_UNIT = 1000; // 100개당 1,000원
    private static final int MAX_ACORN_PER_ORDER = 10000;
    private static final int MAX_PAGE_SIZE = 100;

    private final PaymentMapper paymentMapper;
    private final TossPaymentClient tossPaymentClient;

    @Override
    public OrderCreateResponse createOrder(Long userId, int acornAmount) {
        if (acornAmount < ACORN_UNIT
                || acornAmount % ACORN_UNIT != 0
                || acornAmount > MAX_ACORN_PER_ORDER) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }

        int price = (acornAmount / ACORN_UNIT) * PRICE_PER_UNIT;
        String orderUid = UUID.randomUUID().toString();

        Order order = Order.builder()
                .userId(userId)
                .acornAmount(acornAmount)
                .price(price)
                .status(OrderStatus.PENDING.name())
                .orderUid(orderUid)
                .build();
        paymentMapper.insertOrder(order);

        return OrderCreateResponse.builder()
                .orderUid(orderUid)
                .acornAmount(acornAmount)
                .price(price)
                .build();
    }

    @Override
    @Transactional
    public PaymentConfirmResponse confirmPayment(Long userId, PaymentConfirmRequest request) {
        // ① 주문 조회 + 잠금
        Order order = paymentMapper.findOrderByUidForUpdate(request.getOrderUid());
        if (order == null) {
            throw new BusinessException(ErrorCode.ORDER_NOT_FOUND);
        }
        // ② 내 주문인지
        if (!order.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        // ③ 중복 승인 방지
        if (!OrderStatus.PENDING.name().equals(order.getStatus())) {
            throw new BusinessException(ErrorCode.ALREADY_PROCESSED_ORDER);
        }
        // ④ 금액 위변조 검증
        if (order.getPrice() != request.getAmount()) {
            throw new BusinessException(ErrorCode.AMOUNT_MISMATCH);
        }

        // ⑤ 토스 승인
        TossConfirmResponse toss = tossPaymentClient.confirm(
                request.getPaymentKey(), request.getOrderUid(), request.getAmount());

        // ⑥ 결제 기록 + 주문 상태 변경
        paymentMapper.insertPayment(order.getOrderId(), toss.getPaymentKey(),
                toss.getMethod(), toss.getTotalAmount(), toss.getStatus());
        paymentMapper.updateOrderStatus(order.getOrderId(), OrderStatus.PAID.name());

        // ⑦ 지갑 지급 (없으면 생성 — lazy)
        AcornWallet wallet = paymentMapper.findWalletForUpdate(userId);
        if (wallet == null) {
            paymentMapper.insertWallet(userId);
            wallet = paymentMapper.findWalletForUpdate(userId);
        }
        int balanceAfter = wallet.getBalance() + order.getAcornAmount();
        paymentMapper.addWalletBalance(userId, order.getAcornAmount());
        paymentMapper.insertAcornTransaction(userId, order.getAcornAmount(),
                balanceAfter, AcornTxReason.CHARGE.name(), order.getOrderId());

        return PaymentConfirmResponse.builder()
                .orderUid(order.getOrderUid())
                .chargedAcorn(order.getAcornAmount())
                .balance(balanceAfter)
                .build();
    }

    /**
     * [취소 1단계] 검증 + CANCELING 마킹. 짧은 트랜잭션.
     * 기존 cancelPayment의 ①~⑤ 검증 로직이 그대로 이동했다.
     * 주문 상태를 CANCELING으로 바꿔서 커밋하므로, 이후 중복 취소 요청은
     * ③ 검증(PAID만 취소 가능)에서 자동으로 차단된다.
     * FOR UPDATE 락은 이 메서드가 끝나는 즉시 풀린다.
     */
    @Override
    @Transactional
    public String prepareCancel(Long userId, PaymentCancelRequest request) {
        // ① 주문 조회 + 잠금
        Order order = paymentMapper.findOrderByUidForUpdate(request.getOrderUid());
        if (order == null) {
            throw new BusinessException(ErrorCode.ORDER_NOT_FOUND);
        }
        // ② 본인 확인
        if (!order.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        // ③ PAID 상태만 취소 가능 (CANCELING/CANCELED면 여기서 차단)
        if (!OrderStatus.PAID.name().equals(order.getStatus())) {
            throw new BusinessException(ErrorCode.CANCEL_NOT_ALLOWED);
        }
        // ④ 지갑 잠금 + 잔액 검증 (정책: 충전분 미사용 시에만 전액 환불)
        AcornWallet wallet = paymentMapper.findWalletForUpdate(userId);
        if (wallet == null || wallet.getBalance() < order.getAcornAmount()) {
            throw new BusinessException(ErrorCode.REFUND_INSUFFICIENT_BALANCE);
        }
        // ⑤ 결제 키 조회
        String pgTxId = paymentMapper.findPgTxIdByOrderId(order.getOrderId());
        if (pgTxId == null) {
            throw new BusinessException(ErrorCode.PAYMENT_NOT_FOUND);
        }

        // ⑥ 취소 진행중 마킹 (여기서 커밋 → 락 해제)
        paymentMapper.updateOrderStatus(order.getOrderId(), OrderStatus.CANCELING.name());
        return pgTxId;
    }

    /**
     * [취소 실패 복구] 토스 취소 호출이 실패했을 때 CANCELING → PAID 원복.
     */
    @Override
    @Transactional
    public void revertCancelStatus(Long userId, PaymentCancelRequest request) {
        Order order = paymentMapper.findOrderByUidForUpdate(request.getOrderUid());
        if (order != null && OrderStatus.CANCELING.name().equals(order.getStatus())) {
            paymentMapper.updateOrderStatus(order.getOrderId(), OrderStatus.PAID.name());
        }
    }

    /**
     * [취소 2단계] 토스 취소 성공 후 내부 상태 갱신. 짧은 트랜잭션.
     * 기존 cancelPayment의 ⑦ 갱신 로직이 그대로 이동했다.
     * 이 트랜잭션이 실패하면 주문은 CANCELING 상태로 남아 로그 기반 보정이 가능하다.
     */
    @Override
    @Transactional
    public PaymentCancelResponse completeCancel(Long userId, PaymentCancelRequest request) {
        // 상태 재확인 (CANCELING이어야 정상 흐름)
        Order order = paymentMapper.findOrderByUidForUpdate(request.getOrderUid());
        if (order == null || !OrderStatus.CANCELING.name().equals(order.getStatus())) {
            throw new BusinessException(ErrorCode.CANCEL_NOT_ALLOWED);
        }
        // 잔액 재검증 (락 해제 후 도토리를 써버렸을 수 있으므로)
        AcornWallet wallet = paymentMapper.findWalletForUpdate(userId);
        if (wallet == null || wallet.getBalance() < order.getAcornAmount()) {
            // 토스는 이미 취소된 상태 — CANCELING으로 남겨 보정 대상이 되게 한다
            throw new BusinessException(ErrorCode.REFUND_INSUFFICIENT_BALANCE);
        }

        // ⑦ 상태 변경 + 도토리 회수 + 원장 기록
        paymentMapper.updatePaymentStatus(order.getOrderId(), OrderStatus.CANCELED.name());
        paymentMapper.updateOrderStatus(order.getOrderId(), OrderStatus.CANCELED.name());
        int balanceAfter = wallet.getBalance() - order.getAcornAmount();
        paymentMapper.addWalletBalance(userId, -order.getAcornAmount());
        paymentMapper.insertAcornTransaction(userId, -order.getAcornAmount(),
                balanceAfter, AcornTxReason.REFUND.name(), order.getOrderId());

        return PaymentCancelResponse.builder()
                .orderUid(order.getOrderUid())
                .refundedAcorn(order.getAcornAmount())
                .balance(balanceAfter)
                .build();
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
}