package com.cwww.payment.service;

import com.cwww.global.exception.BusinessException;
import com.cwww.global.exception.ErrorCode;
import com.cwww.payment.domain.AcornWallet;
import com.cwww.payment.domain.Order;
import com.cwww.payment.domain.OrderStatus;
import com.cwww.payment.dto.PaymentConfirmResponse;
import com.cwww.payment.mapper.PaymentMapper;
import com.cwww.payment.mapper.ReconciliationJobMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentTxHelperTest {

    @Mock private PaymentMapper paymentMapper;
    @Mock private ReconciliationJobMapper reconciliationJobMapper;

    @InjectMocks
    private PaymentTxHelper paymentTxHelper;

    private static final Long USER_ID  = 1L;
    private static final Long ORDER_ID = 10L;

    // ──────────────────────────────────────────────────────────────────────
    // completeConfirm — 멱등성 검증
    // ──────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("completeConfirm_최초처리_지갑충전및원장기록")
    void completeConfirm_최초처리() {
        // Arrange
        Order order = order(1000);
        AcornWallet wallet = wallet(500);
        AcornWallet updatedWallet = wallet(1500);

        given(paymentMapper.findWalletForUpdate(USER_ID)).willReturn(wallet);
        given(paymentMapper.insertAcornTransactionIdempotent(
                eq(USER_ID), eq(1000), eq(1500), eq("CHARGE"), eq(ORDER_ID)))
                .willReturn(1);
        given(paymentMapper.updateOrderStatusCas(ORDER_ID, "CONFIRMING", "PAID")).willReturn(1);
        given(paymentMapper.findWalletByUserId(USER_ID)).willReturn(updatedWallet);

        // Act
        PaymentConfirmResponse result = paymentTxHelper.completeConfirm(
                order, "pk-1", "카드", 10_000, "DONE");

        // Assert
        assertThat(result.getBalance()).isEqualTo(1500);
        verify(paymentMapper).addWalletBalance(USER_ID, 1000);
        verify(paymentMapper).insertPaymentIdempotent(eq(ORDER_ID), any(), any(), anyInt(), any(), eq(USER_ID));
        verify(paymentMapper).updateOrderStatusCas(ORDER_ID, "CONFIRMING", "PAID");
        verify(reconciliationJobMapper).markDoneByOrderAndOperation(ORDER_ID, "CONFIRM");
    }

    @Test
    @DisplayName("completeConfirm_재처리시_지갑이중충전방지")
    void completeConfirm_멱등성_이중충전방지() {
        // Arrange
        Order order = order(1000);
        AcornWallet wallet = wallet(1500);

        given(paymentMapper.findWalletForUpdate(USER_ID)).willReturn(wallet);
        given(paymentMapper.insertAcornTransactionIdempotent(
                eq(USER_ID), eq(1000), eq(2500), eq("CHARGE"), eq(ORDER_ID)))
                .willReturn(0);
        given(paymentMapper.updateOrderStatusCas(ORDER_ID, "CONFIRMING", "PAID")).willReturn(1);
        given(paymentMapper.findWalletByUserId(USER_ID)).willReturn(wallet);

        // Act
        paymentTxHelper.completeConfirm(order, "pk-1", "카드", 10_000, "DONE");

        // Assert: 지갑 충전 호출 안 됨 (이중 충전 방지)
        verify(paymentMapper, never()).addWalletBalance(any(), anyInt());
    }

    @Test
    @DisplayName("validateAndTransitionToConfirming_타인주문_예외")
    void validateAndTransitionToConfirming_타인주문() {
        // Arrange
        Order otherUserOrder = Order.builder()
                .orderId(ORDER_ID).userId(999L)
                .acornAmount(1000).price(10_000)
                .status(OrderStatus.PENDING.name()).orderUid("uid-1")
                .build();

        given(paymentMapper.findOrderByUidForUpdate("uid-1")).willReturn(otherUserOrder);

        // Act & Assert
        assertThatThrownBy(() -> paymentTxHelper.validateAndTransitionToConfirming(
                USER_ID, "uid-1", 10_000, "pk-1"))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.FORBIDDEN);
    }

    @Test
    @DisplayName("validateAndTransitionToConfirming_처리중주문_예외")
    void validateAndTransitionToConfirming_CONFIRMING중() {
        // Arrange
        Order confirming = Order.builder()
                .orderId(ORDER_ID).userId(USER_ID)
                .acornAmount(1000).price(10_000)
                .status(OrderStatus.CONFIRMING.name()).orderUid("uid-1")
                .build();

        given(paymentMapper.findOrderByUidForUpdate("uid-1")).willReturn(confirming);

        // Act & Assert
        assertThatThrownBy(() -> paymentTxHelper.validateAndTransitionToConfirming(
                USER_ID, "uid-1", 10_000, "pk-1"))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.ORDER_IN_PROGRESS);
    }

    @Test
    @DisplayName("validateAndTransitionToConfirming_금액불일치_예외")
    void validateAndTransitionToConfirming_금액불일치() {
        // Arrange
        Order order = Order.builder()
                .orderId(ORDER_ID).userId(USER_ID)
                .acornAmount(1000).price(10_000)
                .status(OrderStatus.PENDING.name()).orderUid("uid-1")
                .build();

        given(paymentMapper.findOrderByUidForUpdate("uid-1")).willReturn(order);

        // Act & Assert
        assertThatThrownBy(() -> paymentTxHelper.validateAndTransitionToConfirming(
                USER_ID, "uid-1", 9_999, "pk-1"))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.AMOUNT_MISMATCH);
    }

    @Test
    @DisplayName("validateAndTransitionToCanceling_잔액부족_예외")
    void validateAndTransitionToCanceling_잔액부족() {
        // Arrange
        Order paidOrder = Order.builder()
                .orderId(ORDER_ID).userId(USER_ID)
                .acornAmount(1000).price(10_000)
                .status(OrderStatus.PAID.name()).orderUid("uid-1")
                .build();
        AcornWallet emptyWallet = wallet(500);

        given(paymentMapper.findOrderByUidForUpdate("uid-1")).willReturn(paidOrder);
        given(paymentMapper.findWalletForUpdate(USER_ID)).willReturn(emptyWallet);

        // Act & Assert
        assertThatThrownBy(() -> paymentTxHelper.validateAndTransitionToCanceling(USER_ID, "uid-1"))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.REFUND_INSUFFICIENT_BALANCE);
    }

    // ──────────────────────────────────────────────────────────────────────
    // helpers
    // ──────────────────────────────────────────────────────────────────────

    private Order order(int acornAmount) {
        return Order.builder()
                .orderId(ORDER_ID).userId(USER_ID)
                .acornAmount(acornAmount).price(acornAmount * 10)
                .status(OrderStatus.CONFIRMING.name()).orderUid("uid-1")
                .build();
    }

    private AcornWallet wallet(int balance) {
        AcornWallet w = mock(AcornWallet.class);
        given(w.getBalance()).willReturn(balance);
        return w;
    }
}
