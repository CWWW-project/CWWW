package com.cwww.payment.dto;

import lombok.Getter;

@Getter
public class PaymentConfirmRequest {
    private String paymentKey;
    private String orderUid;
    private int amount;
}
