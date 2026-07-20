package com.cwww.payment.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class AdminOrderResponse {
    private Long orderId;
    private String orderUid;
    private Long userId;
    private int acornAmount;
    private int price;
    private String status;
    private LocalDateTime createdAt; // TODO: orders 테이블에 created_at 없으면 필드/SQL에서 제거
}
