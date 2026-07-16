
-- 도토리 충전 주문
CREATE TABLE orders (
                        order_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                        user_id BIGINT NOT NULL REFERENCES users(user_id),
                        acorn_amount INT NOT NULL,
                        price INT NOT NULL,
                        status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
                        order_uid VARCHAR(100) NOT NULL UNIQUE,
                        created_at TIMESTAMP NOT NULL DEFAULT now(),
                        updated_at TIMESTAMP
);

-- 기존 payment 테이블(V1)에 주문 연결 컬럼 추가
ALTER TABLE payment ADD COLUMN order_id BIGINT REFERENCES orders(order_id);

-- 도토리 변동 원장
CREATE TABLE acorn_transaction (
                                   acorn_tx_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                                   user_id BIGINT NOT NULL REFERENCES users(user_id),
                                   amount INT NOT NULL,
                                   balance_after INT NOT NULL,
                                   reason VARCHAR(20) NOT NULL,
                                   ref_id BIGINT,
                                   created_at TIMESTAMP NOT NULL DEFAULT now(),
                                   CONSTRAINT chk_acorn_tx_amount CHECK (amount <> 0)
);