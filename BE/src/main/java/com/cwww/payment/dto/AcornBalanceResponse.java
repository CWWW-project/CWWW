package com.cwww.payment.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AcornBalanceResponse {
    private int balance;
    private int availableBalance;
}