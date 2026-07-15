package com.cwww.payment.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PaymentConfirmResponse {
    private String orderUid;
    private int chargedAcorn;   // 이번에 충전된 도토리
    private int balance;        // 충전 후 잔액
}
