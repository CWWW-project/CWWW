package com.cwww.payment.service;

import com.cwww.payment.client.TossBusinessException;
import com.cwww.payment.client.TossPaymentClient;
import com.cwww.payment.client.TossPaymentResponse;
import com.cwww.payment.client.TossUncertainException;
import com.cwww.payment.domain.*;
import com.cwww.payment.mapper.PaymentMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReconciliationSchedulerTest {

    @Mock private ReconciliationTxHelper reconciliationTxHelper;
    @Mock private PaymentTxHelper paymentTxHelper;
    @Mock private PaymentMapper paymentMapper;
    @Mock private TossPaymentClient tossPaymentClient;

    @InjectMocks
    private ReconciliationScheduler scheduler;

    private static final Long JOB_ID   = 1L;
    private static final Long ORDER_ID = 10L;
    private static final String PG_TX_ID = "toss-pk-1";

    private ReconciliationJob confirmJob;
    private ReconciliationJob cancelJob;
    private Order confirming;
    private Order canceling;

    @BeforeEach
    void setUp() {
        confirmJob = ReconciliationJob.builder()
                .jobId(JOB_ID).orderId(ORDER_ID)
                .operation(JobOperation.CONFIRM.name())
                .status(JobStatus.PROCESSING.name())
                .retryCount(0).maxRetries(5)
                .nextAttemptAt(LocalDateTime.now().minusSeconds(10))
                .build();

        cancelJob = ReconciliationJob.builder()
                .jobId(JOB_ID).orderId(ORDER_ID)
                .operation(JobOperation.CANCEL.name())
                .status(JobStatus.PROCESSING.name())
                .retryCount(0).maxRetries(5)
                .nextAttemptAt(LocalDateTime.now().minusSeconds(10))
                .build();

        confirming = Order.builder()
                .orderId(ORDER_ID).userId(1L)
                .acornAmount(1000).price(10_000)
                .status(OrderStatus.CONFIRMING.name()).orderUid("uid-1")
                .build();

        canceling = Order.builder()
                .orderId(ORDER_ID).userId(1L)
                .acornAmount(1000).price(10_000)
                .status(OrderStatus.CANCELING.name()).orderUid("uid-1")
                .build();
    }

    @Test
    @DisplayName("process_작업없음_아무것도실행안함")
    void process_작업없음() {
        given(reconciliationTxHelper.claimNextJob()).willReturn(null);

        scheduler.process();

        verify(tossPaymentClient, never()).getPayment(any());
    }

    @Test
    @DisplayName("CONFIRM_PG_DONE_내부승인완료처리")
    void confirm_PG_DONE_승인완료() {
        // Arrange
        TossPaymentResponse pgDone = mock(TossPaymentResponse.class);
        given(pgDone.getStatus()).willReturn("DONE");
        given(pgDone.getMethod()).willReturn("카드");
        given(pgDone.getTotalAmount()).willReturn(10_000);

        given(reconciliationTxHelper.claimNextJob()).willReturn(confirmJob);
        given(paymentMapper.findOrderById(ORDER_ID)).willReturn(confirming);
        given(paymentMapper.findPgTxIdByOrderId(ORDER_ID)).willReturn(PG_TX_ID);
        given(tossPaymentClient.getPayment(PG_TX_ID)).willReturn(pgDone);

        // Act
        scheduler.process();

        // Assert
        verify(paymentTxHelper).completeConfirm(confirming, PG_TX_ID, "카드", 10_000, "DONE");
        verify(reconciliationTxHelper).markDone(JOB_ID);
    }

    @Test
    @DisplayName("CONFIRM_PG_ABORTED_PENDING복구")
    void confirm_PG_ABORTED_PENDING복구() {
        // Arrange
        TossPaymentResponse pgAborted = mock(TossPaymentResponse.class);
        given(pgAborted.getStatus()).willReturn("ABORTED");

        given(reconciliationTxHelper.claimNextJob()).willReturn(confirmJob);
        given(paymentMapper.findOrderById(ORDER_ID)).willReturn(confirming);
        given(paymentMapper.findPgTxIdByOrderId(ORDER_ID)).willReturn(PG_TX_ID);
        given(tossPaymentClient.getPayment(PG_TX_ID)).willReturn(pgAborted);

        // Act
        scheduler.process();

        // Assert
        verify(paymentTxHelper).recoverOrderToPending(ORDER_ID);
        verify(reconciliationTxHelper).markDone(JOB_ID);
        verify(paymentTxHelper, never()).completeConfirm(any(), any(), any(), anyInt(), any());
    }

    @Test
    @DisplayName("CANCEL_PG_CANCELED_내부취소완료처리")
    void cancel_PG_CANCELED_취소완료() {
        // Arrange
        TossPaymentResponse pgCanceled = mock(TossPaymentResponse.class);
        given(pgCanceled.getStatus()).willReturn("CANCELED");

        given(reconciliationTxHelper.claimNextJob()).willReturn(cancelJob);
        given(paymentMapper.findOrderById(ORDER_ID)).willReturn(canceling);
        given(paymentMapper.findPgTxIdByOrderId(ORDER_ID)).willReturn(PG_TX_ID);
        given(tossPaymentClient.getPayment(PG_TX_ID)).willReturn(pgCanceled);

        // Act
        scheduler.process();

        // Assert
        verify(paymentTxHelper).completeCancel(ORDER_ID);
        verify(reconciliationTxHelper).markDone(JOB_ID);
    }

    @Test
    @DisplayName("CANCEL_PG_DONE_취소명시거절_PAID복구")
    void cancel_PG_DONE_PAID복구() {
        // Arrange
        TossPaymentResponse pgDone = mock(TossPaymentResponse.class);
        given(pgDone.getStatus()).willReturn("DONE");

        given(reconciliationTxHelper.claimNextJob()).willReturn(cancelJob);
        given(paymentMapper.findOrderById(ORDER_ID)).willReturn(canceling);
        given(paymentMapper.findPgTxIdByOrderId(ORDER_ID)).willReturn(PG_TX_ID);
        given(tossPaymentClient.getPayment(PG_TX_ID)).willReturn(pgDone);

        // Act
        scheduler.process();

        // Assert
        verify(paymentTxHelper).recoverOrderToPaid(ORDER_ID);
        verify(reconciliationTxHelper).markDone(JOB_ID);
        verify(paymentTxHelper, never()).completeCancel(any());
    }

    @Test
    @DisplayName("PG조회_불확실오류_재스케줄")
    void PG조회_불확실오류_재스케줄() {
        // Arrange
        given(reconciliationTxHelper.claimNextJob()).willReturn(confirmJob);
        given(paymentMapper.findOrderById(ORDER_ID)).willReturn(confirming);
        given(paymentMapper.findPgTxIdByOrderId(ORDER_ID)).willReturn(PG_TX_ID);
        given(tossPaymentClient.getPayment(PG_TX_ID))
                .willThrow(new TossUncertainException("타임아웃", null));

        // Act
        scheduler.process();

        // Assert
        verify(reconciliationTxHelper).reschedule(eq(JOB_ID), eq(1), any(), contains("타임아웃"));
        verify(reconciliationTxHelper, never()).markDone(any());
        verify(reconciliationTxHelper, never()).markFailed(any(), any());
    }

    @Test
    @DisplayName("최대재시도초과_FAILED처리")
    void 최대재시도초과() {
        // Arrange — retryCount가 이미 maxRetries와 같음
        ReconciliationJob exhaustedJob = ReconciliationJob.builder()
                .jobId(JOB_ID).orderId(ORDER_ID)
                .operation(JobOperation.CONFIRM.name())
                .status(JobStatus.PROCESSING.name())
                .retryCount(5).maxRetries(5)
                .nextAttemptAt(LocalDateTime.now().minusSeconds(10))
                .build();

        given(reconciliationTxHelper.claimNextJob()).willReturn(exhaustedJob);
        given(paymentMapper.findOrderById(ORDER_ID)).willReturn(confirming);
        given(paymentMapper.findPgTxIdByOrderId(ORDER_ID)).willReturn(PG_TX_ID);
        given(tossPaymentClient.getPayment(PG_TX_ID))
                .willThrow(new TossUncertainException("5xx", null));

        // Act
        scheduler.process();

        // Assert
        verify(reconciliationTxHelper).markFailed(eq(JOB_ID), contains("최대 재시도 초과"));
        verify(reconciliationTxHelper, never()).reschedule(any(), anyInt(), any(), any());
    }

    @Test
    @DisplayName("이미완료된주문_보정작업즉시DONE처리")
    void 이미완료된주문_즉시DONE() {
        // Arrange — 주문이 이미 PAID
        Order alreadyPaid = Order.builder()
                .orderId(ORDER_ID).userId(1L)
                .acornAmount(1000).price(10_000)
                .status(OrderStatus.PAID.name()).orderUid("uid-1")
                .build();

        given(reconciliationTxHelper.claimNextJob()).willReturn(confirmJob);
        given(paymentMapper.findOrderById(ORDER_ID)).willReturn(alreadyPaid);

        // Act
        scheduler.process();

        // Assert
        verify(reconciliationTxHelper).markDone(JOB_ID);
        verify(tossPaymentClient, never()).getPayment(any());
    }

    @Test
    @DisplayName("CONFIRM_pgTxId없음_PENDING복구")
    void confirm_pgTxId없음_PENDING복구() {
        // Arrange — pgTxId가 없으면 PG 호출 전에 실패한 것 → PENDING 복구
        given(reconciliationTxHelper.claimNextJob()).willReturn(confirmJob);
        given(paymentMapper.findOrderById(ORDER_ID)).willReturn(confirming);
        given(paymentMapper.findPgTxIdByOrderId(ORDER_ID)).willReturn(null);

        // Act
        scheduler.process();

        // Assert
        verify(paymentTxHelper).recoverOrderToPending(ORDER_ID);
        verify(reconciliationTxHelper).markDone(JOB_ID);
        verify(tossPaymentClient, never()).getPayment(any());
    }
}
