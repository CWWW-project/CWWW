package com.cwww.payment.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;

/** POST /v1/payments/{paymentKey}/cancel 취소 응답 */
@Getter
@JsonIgnoreProperties(ignoreUnknown = true)
public class TossCancelResponse {
    private String paymentKey;
    private String orderId;
    private String status;   // CANCELED
    private int totalAmount;
}
