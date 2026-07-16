-- V13: 보정 작업 테이블 개선 — paymentKey 영속화 + 낙관적 락(version)
-- paymentKey: CONFIRM 보정 시 payment 행 없이도 PG 조회 가능 (이중 결제 방지)
-- version   : markDone/markFailed/reschedule 시 다른 워커가 선점한 경우 충돌 방지

ALTER TABLE payment_reconciliation_job
    ADD COLUMN payment_key VARCHAR(200),          -- PG 거래 키 (CONFIRM 잡에 필수, CANCEL 잡은 NULL 허용)
    ADD COLUMN version     BIGINT NOT NULL DEFAULT 0; -- 낙관적 락: 갱신마다 +1
