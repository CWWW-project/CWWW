package com.cwww.payment.client;

/** 타임아웃·연결 단절·5xx 등 PG 호출 결과가 불확실한 경우 — 상태를 임의로 단정하면 안 됨 */
public class TossUncertainException extends RuntimeException {

    public TossUncertainException(String message, Throwable cause) {
        super(message, cause);
    }
}
