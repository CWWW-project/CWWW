package com.cwww.payment.domain;

import lombok.Getter;

@Getter
public class AcornWallet {
    private Long walletId;
    private Long userId;
    private int balance;
    private int reservedBalance;

    /** 실제 사용 가능한 잔액 = balance - reservedBalance */
    public int getAvailableBalance() {
        return balance - reservedBalance;
    }
}