package com.cwww.payment.dto;

import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class AcornHistoryResponse {
    private int amount;
    private int balanceAfter;
    private String reason;
    private LocalDateTime createdAt;
}