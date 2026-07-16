package com.cwww.payment.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;

/**
 * GET /v1/payments/{paymentKey} 상태 조회 응답
 * status: READY | IN_PROGRESS | WAITING_FOR_DEPOSIT | DONE | CANCELED | PARTIAL_CANCELED | ABORTED | EXPIRED
 */
@Getter
@JsonIgnoreProperties(ignoreUnknown = true)
public class TossPaymentResponse {
    private String paymentKey;
    private String orderId;
    private String status;
    private int totalAmount;
    private String method;
    private String approvedAt;
}
