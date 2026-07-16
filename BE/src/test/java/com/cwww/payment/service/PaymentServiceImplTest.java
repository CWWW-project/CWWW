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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class PaymentServiceImplTest {

    @Mock private PaymentMapper paymentMapper;
    @Mock private TossPaymentClient tossPaymentClient;
    @Mock private PaymentTxHelper paymentTxHelper;

    @InjectMocks
    private PaymentServiceImpl paymentService;

    private static final Long USER_ID    = 1L;
    private static final Long ORDER_ID   = 10L;
    private static final String ORDER_UID   = "order-uid-1";
    private static final String PAYMENT_KEY = "toss-pk-1";
    private static final int ACORN_AMOUNT   = 1000;
    private static final int PRICE          = 10_000;

    private Order pendingOrder;
    private PaymentConfirmRequest confirmRequest;
    private PaymentCancelRequest cancelRequest;
    private TossConfirmResponse tossOk;
    private TossCancelResponse tossCancelOk;

    @BeforeEach
    void setUp() {
        pendingOrder = Order.builder()
                .orderId(ORDER_ID).userId(USER_ID)
                .acornAmount(ACORN_AMOUNT).price(PRICE)
                .status(OrderStatus.PENDING.name()).orderUid(ORDER_UID)
                .build();

        confirmRequest = mock(PaymentConfirmRequest.class);
        given(confirmRequest.getPaymentKey()).willReturn(PAYMENT_KEY);
        given(confirmRequest.getOrderUid()).willReturn(ORDER_UID);
        given(confirmRequest.getAmount()).willReturn(PRICE);

        cancelRequest = mock(PaymentCancelRequest.class);
        given(cancelRequest.getOrderUid()).willReturn(ORDER_UID);
        given(cancelRequest.getReason()).willReturn("단순 변심");

        tossOk = mock(TossConfirmResponse.class);
        given(tossOk.getStatus()).willReturn("DONE");
        given(tossOk.getPaymentKey()).willReturn(PAYMENT_KEY);
        given(tossOk.getOrderId()).willReturn(ORDER_UID);
        given(tossOk.getTotalAmount()).willReturn(PRICE);
        given(tossOk.getMethod()).willReturn("카드");

        tossCancelOk = mock(TossCancelResponse.class);
        given(tossCancelOk.getStatus()).willReturn("CANCELED");
        given(tossCancelOk.getPaymentKey()).willReturn(PAYMENT_KEY);
    }

    // ──────────────────────────────────────────────────────────────────────
    // confirmPayment
    // ──────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("confirmPayment_성공_완료응답반환")
    void confirmPayment_성공() {
        // Arrange
        PaymentConfirmResponse expected = PaymentConfirmResponse.builder()
                .orderUid(ORDER_UID).chargedAcorn(ACORN_AMOUNT).balance(1000).build();

        given(paymentTxHelper.validateAndTransitionToConfirming(USER_ID, ORDER_UID, PRICE, PAYMENT_KEY))
                .willReturn(pendingOrder);
        given(tossPaymentClient.confirm(PAYMENT_KEY, ORDER_UID, PRICE)).willReturn(tossOk);
        given(paymentTxHelper.completeConfirm(eq(pendingOrder), eq(PAYMENT_KEY), eq("카드"), eq(PRICE), eq("DONE")))
                .willReturn(expected);

        // Act
        PaymentConfirmResponse result = paymentService.confirmPayment(USER_ID, confirmRequest);

        // Assert
        assertThat(result.getChargedAcorn()).isEqualTo(ACORN_AMOUNT);
        assertThat(result.getBalance()).isEqualTo(1000);
        verify(paymentTxHelper).completeConfirm(pendingOrder, PAYMENT_KEY, "카드", PRICE, "DONE");
    }

    @Test
    @DisplayName("confirmPayment_이미처리된주문_예외")
    void confirmPayment_중복승인차단() {
        // Arrange — validateAndTransitionToConfirming 에서 이미 예외 던짐
        given(paymentTxHelper.validateAndTransitionToConfirming(USER_ID, ORDER_UID, PRICE, PAYMENT_KEY))
                .willThrow(new BusinessException(ErrorCode.ALREADY_PROCESSED_ORDER));

        // Act & Assert
        assertThatThrownBy(() -> paymentService.confirmPayment(USER_ID, confirmRequest))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.ALREADY_PROCESSED_ORDER);

        verify(tossPaymentClient, never()).confirm(any(), any(), anyInt());
    }

    @Test
    @DisplayName("confirmPayment_PG명시거절_PENDING복구후예외")
    void confirmPayment_PG명시거절() {
        // Arrange
        given(paymentTxHelper.validateAndTransitionToConfirming(USER_ID, ORDER_UID, PRICE, PAYMENT_KEY))
                .willReturn(pendingOrder);
        given(tossPaymentClient.confirm(PAYMENT_KEY, ORDER_UID, PRICE))
                .willThrow(new TossBusinessException("REJECT", "PG 거절"));

        // Act & Assert
        assertThatThrownBy(() -> paymentService.confirmPayment(USER_ID, confirmRequest))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.PAYMENT_PG_REJECTED);

        // 검증: PENDING 복구 O (보정 잡은 선생성되어 있으니 같이 닫힘)
        verify(paymentTxHelper).recoverOrderToPending(ORDER_ID);
    }

    @Test
    @DisplayName("confirmPayment_PG불확실오류_CONFIRMING유지_보정잡스케줄러위임")
    void confirmPayment_PG불확실오류() {
        // Arrange
        given(paymentTxHelper.validateAndTransitionToConfirming(USER_ID, ORDER_UID, PRICE, PAYMENT_KEY))
                .willReturn(pendingOrder);
        given(tossPaymentClient.confirm(PAYMENT_KEY, ORDER_UID, PRICE))
                .willThrow(new TossUncertainException("타임아웃", null));

        // Act & Assert
        assertThatThrownBy(() -> paymentService.confirmPayment(USER_ID, confirmRequest))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.PAYMENT_CONFIRM_FAILED);

        // 검증: PENDING 복구 X (선생성된 보정 잡이 스케줄러에 의해 처리됨)
        verify(paymentTxHelper, never()).recoverOrderToPending(any());
    }

    @Test
    @DisplayName("confirmPayment_PG성공후내부처리실패_보정잡스케줄러위임")
    void confirmPayment_PG성공후내부처리실패() {
        // Arrange
        given(paymentTxHelper.validateAndTransitionToConfirming(USER_ID, ORDER_UID, PRICE, PAYMENT_KEY))
                .willReturn(pendingOrder);
        given(tossPaymentClient.confirm(PAYMENT_KEY, ORDER_UID, PRICE)).willReturn(tossOk);
        given(paymentTxHelper.completeConfirm(any(), any(), any(), anyInt(), any()))
                .willThrow(new RuntimeException("DB 장애"));

        // Act & Assert
        assertThatThrownBy(() -> paymentService.confirmPayment(USER_ID, confirmRequest))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.PAYMENT_CONFIRM_FAILED);

        // 검증: 선생성된 보정 잡이 스케줄러에 위임됨 (PENDING 복구 X)
        verify(paymentTxHelper, never()).recoverOrderToPending(any());
    }

    // ──────────────────────────────────────────────────────────────────────
    // cancelPayment
    // ──────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("cancelPayment_성공_환불응답반환")
    void cancelPayment_성공() {
        // Arrange
        Order paidOrder = Order.builder()
                .orderId(ORDER_ID).userId(USER_ID)
                .acornAmount(ACORN_AMOUNT).price(PRICE)
                .status(OrderStatus.PAID.name()).orderUid(ORDER_UID)
                .build();
        PaymentCancelResponse expected = PaymentCancelResponse.builder()
                .orderUid(ORDER_UID).refundedAcorn(ACORN_AMOUNT).balance(0).build();

        given(paymentTxHelper.validateAndTransitionToCanceling(USER_ID, ORDER_UID)).willReturn(paidOrder);
        given(paymentMapper.findPgTxIdByOrderId(ORDER_ID)).willReturn(PAYMENT_KEY);
        given(tossPaymentClient.cancel(PAYMENT_KEY, "단순 변심")).willReturn(tossCancelOk);
        given(paymentTxHelper.completeCancel(ORDER_ID)).willReturn(expected);

        // Act
        PaymentCancelResponse result = paymentService.cancelPayment(USER_ID, cancelRequest);

        // Assert
        assertThat(result.getRefundedAcorn()).isEqualTo(ACORN_AMOUNT);
        verify(tossPaymentClient).cancel(PAYMENT_KEY, "단순 변심");
        verify(paymentTxHelper).completeCancel(ORDER_ID);
    }

    @Test
    @DisplayName("cancelPayment_PG이미취소됨_내부취소완료처리")
    void cancelPayment_ALREADY_CANCELED() {
        // Arrange
        Order paidOrder = Order.builder()
                .orderId(ORDER_ID).userId(USER_ID)
                .acornAmount(ACORN_AMOUNT).price(PRICE)
                .status(OrderStatus.PAID.name()).orderUid(ORDER_UID)
                .build();
        PaymentCancelResponse expected = PaymentCancelResponse.builder()
                .orderUid(ORDER_UID).refundedAcorn(ACORN_AMOUNT).balance(0).build();

        given(paymentTxHelper.validateAndTransitionToCanceling(USER_ID, ORDER_UID)).willReturn(paidOrder);
        given(paymentMapper.findPgTxIdByOrderId(ORDER_ID)).willReturn(PAYMENT_KEY);
        given(tossPaymentClient.cancel(PAYMENT_KEY, "단순 변심"))
                .willThrow(new TossBusinessException("ALREADY_CANCELED", "이미 취소된 결제"));
        given(paymentTxHelper.completeCancel(ORDER_ID)).willReturn(expected);

        // Act
        PaymentCancelResponse result = paymentService.cancelPayment(USER_ID, cancelRequest);

        // Assert: PG 이미 취소 → 내부 완료 처리 (PAID 복구 X)
        assertThat(result.getRefundedAcorn()).isEqualTo(ACORN_AMOUNT);
        verify(paymentTxHelper).completeCancel(ORDER_ID);
        verify(paymentTxHelper, never()).recoverOrderToPaid(any());
    }

    @Test
    @DisplayName("cancelPayment_PG명시거절_PAID복구")
    void cancelPayment_PG명시거절() {
        // Arrange
        Order paidOrder = Order.builder()
                .orderId(ORDER_ID).userId(USER_ID)
                .acornAmount(ACORN_AMOUNT).price(PRICE)
                .status(OrderStatus.PAID.name()).orderUid(ORDER_UID)
                .build();

        given(paymentTxHelper.validateAndTransitionToCanceling(USER_ID, ORDER_UID)).willReturn(paidOrder);
        given(paymentMapper.findPgTxIdByOrderId(ORDER_ID)).willReturn(PAYMENT_KEY);
        given(tossPaymentClient.cancel(PAYMENT_KEY, "단순 변심"))
                .willThrow(new TossBusinessException("CARD_LIMIT_EXCEEDED", "한도 초과"));

        // Act & Assert
        assertThatThrownBy(() -> paymentService.cancelPayment(USER_ID, cancelRequest))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.PAYMENT_CANCEL_FAILED);

        // 검증: PAID 복구 O (보정 잡도 닫힘), completeCancel X
        verify(paymentTxHelper).recoverOrderToPaid(ORDER_ID);
        verify(paymentTxHelper, never()).completeCancel(any());
    }

    @Test
    @DisplayName("cancelPayment_PG불확실오류_CANCELING유지_보정잡스케줄러위임")
    void cancelPayment_PG불확실오류() {
        // Arrange
        Order paidOrder = Order.builder()
                .orderId(ORDER_ID).userId(USER_ID)
                .acornAmount(ACORN_AMOUNT).price(PRICE)
                .status(OrderStatus.PAID.name()).orderUid(ORDER_UID)
                .build();

        given(paymentTxHelper.validateAndTransitionToCanceling(USER_ID, ORDER_UID)).willReturn(paidOrder);
        given(paymentMapper.findPgTxIdByOrderId(ORDER_ID)).willReturn(PAYMENT_KEY);
        given(tossPaymentClient.cancel(PAYMENT_KEY, "단순 변심"))
                .willThrow(new TossUncertainException("타임아웃", null));

        // Act & Assert
        assertThatThrownBy(() -> paymentService.cancelPayment(USER_ID, cancelRequest))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.PAYMENT_CANCEL_FAILED);

        // 검증: PAID 복구 X (CANCELING 유지, 보정 잡이 60초 후 실행됨), completeCancel X
        verify(paymentTxHelper, never()).recoverOrderToPaid(any());
        verify(paymentTxHelper, never()).completeCancel(any());
    }

    @Test
    @DisplayName("cancelPayment_PAID아닌주문_취소불가예외")
    void cancelPayment_PAID아닌주문() {
        // Arrange — validateAndTransitionToCanceling 에서 예외 던짐
        given(paymentTxHelper.validateAndTransitionToCanceling(USER_ID, ORDER_UID))
                .willThrow(new BusinessException(ErrorCode.CANCEL_NOT_ALLOWED));

        // Act & Assert
        assertThatThrownBy(() -> paymentService.cancelPayment(USER_ID, cancelRequest))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.CANCEL_NOT_ALLOWED);

        verify(tossPaymentClient, never()).cancel(any(), any());
    }

    // ──────────────────────────────────────────────────────────────────────
    // createOrder
    // ──────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("createOrder_userId_null_예외")
    void createOrder_비인증() {
        assertThatThrownBy(() -> paymentService.createOrder(null, 100))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.FORBIDDEN);
    }

    @Test
    @DisplayName("createOrder_단위미달_예외")
    void createOrder_유효하지않은금액() {
        assertThatThrownBy(() -> paymentService.createOrder(USER_ID, 50))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.INVALID_INPUT);
    }
}
