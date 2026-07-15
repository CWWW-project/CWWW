package com.cwww.payment.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class OrderCreateResponse {
    private String orderUid;   // 토스 결제창에 넘길 주문 고유번호
    private int acornAmount;
    private int price;         // 서버가 계산한 결제 금액(원)
}
