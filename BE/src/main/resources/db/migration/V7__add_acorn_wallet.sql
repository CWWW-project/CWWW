-- 도토리(acorn) 잔액을 users 테이블에서 분리해 별도 지갑 테이블로 관리
ALTER TABLE users DROP COLUMN acorn_balance;

CREATE TABLE acorn_wallet (
    wallet_id   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id     BIGINT NOT NULL UNIQUE REFERENCES users(user_id),
    balance     INT NOT NULL DEFAULT 0 CHECK (balance >= 0),
    created_at  TIMESTAMP NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP
);
