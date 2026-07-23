package com.cwww.payment.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;

@Getter
@JsonIgnoreProperties(ignoreUnknown = true)
public class TossConfirmResponse {
    private String paymentKey;
    private String orderId;
    private String method;       // 카드, 간편결제 등
    private String status;       // 승인 성공 시 "DONE"
    private int totalAmount;
    private String approvedAt;
}