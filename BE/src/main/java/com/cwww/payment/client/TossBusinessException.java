package com.cwww.payment.client;

/** PG가 4xx로 명시적으로 거절한 경우 — 결과가 확정적으로 '실패' */
public class TossBusinessException extends RuntimeException {

    private final String errorCode;

    public TossBusinessException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public String getErrorCode() {
        return errorCode;
    }
}
