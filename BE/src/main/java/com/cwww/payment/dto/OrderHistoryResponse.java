package com.cwww.payment.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class OrderHistoryResponse {
    private String orderUid;
    private int acornAmount;
    private int price;
    private String status;
    private LocalDateTime createdAt;
}
