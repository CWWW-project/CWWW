package com.cwww.payment.domain;

import lombok.Getter;

@Getter
public class AcornWallet {
    private Long walletId;
    private Long userId;
    private int balance;
}