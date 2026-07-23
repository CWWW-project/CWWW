package com.cwww.payment.domain;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class Order {
    private Long orderId;
    private Long userId;
    private int acornAmount;
    private int price;
    private String status;      // PENDING, PAID, CANCELED
    private String orderUid;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}