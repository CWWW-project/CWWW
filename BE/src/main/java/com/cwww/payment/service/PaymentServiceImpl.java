package com.cwww.payment.service;

import com.cwww.global.exception.BusinessException;
import com.cwww.global.exception.ErrorCode;
import com.cwww.payment.client.TossConfirmResponse;
import com.cwww.payment.client.TossPaymentClient;
import com.cwww.payment.domain.AcornWallet;
import com.cwww.payment.domain.Order;
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

    private final PaymentMapper paymentMapper;

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
                .status("PENDING")
                .orderUid(orderUid)
                .build();
        paymentMapper.insertOrder(order);

        return OrderCreateResponse.builder()
                .orderUid(orderUid)
                .acornAmount(acornAmount)
                .price(price)
                .build();
    }

    private final TossPaymentClient tossPaymentClient;

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
        if (!"PENDING".equals(order.getStatus())) {
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
        paymentMapper.updateOrderStatus(order.getOrderId(), "PAID");

        // ⑦ 지갑 지급 (없으면 생성 — lazy)
        AcornWallet wallet = paymentMapper.findWalletForUpdate(userId);
        if (wallet == null) {
            paymentMapper.insertWallet(userId);
            wallet = paymentMapper.findWalletForUpdate(userId);
        }
        int balanceAfter = wallet.getBalance() + order.getAcornAmount();
        paymentMapper.addWalletBalance(userId, order.getAcornAmount());
        paymentMapper.insertAcornTransaction(userId, order.getAcornAmount(),
                balanceAfter, "CHARGE", order.getOrderId());

        return PaymentConfirmResponse.builder()
                .orderUid(order.getOrderUid())
                .chargedAcorn(order.getAcornAmount())
                .balance(balanceAfter)
                .build();
    }

    private static final int MAX_PAGE_SIZE = 100;

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