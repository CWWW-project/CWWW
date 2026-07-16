package com.cwww.payment.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PaymentCancelResponse {
    private String orderUid;
    private int refundedAcorn;
    private int balance;      // 환불(회수) 후 잔액
}