package com.cwww.payment.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class AdminOrderDetailResponse {
    // 주문 정보
    private Long orderId;
    private String orderUid;
    private Long userId;
    private int acornAmount;
    private int price;
    private String orderStatus;
    private LocalDateTime createdAt;

    // 결제 정보 (결제 전 주문이면 null)
    private String pgTxId;
    private String method;
    private Integer paymentAmount;
    private String paymentStatus;
    private String pgStatus;
    private String failureCode;
    private LocalDateTime paidAt;
}
