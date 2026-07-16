-- V14: acorn_wallet에 reserved_balance 추가
-- CANCELING 상태에서 환불 예정 도토리를 예약하여 PG 호출 중 이중 차감 방지
ALTER TABLE acorn_wallet
    ADD COLUMN reserved_balance INT NOT NULL DEFAULT 0;
