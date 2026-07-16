-- V12: 결제 정합성 강화 — 상태 제약, 유일성 인덱스, 보정 작업 테이블
-- ※ Flyway 10.x (Spring Boot 3.x) 는 SQL 마이그레이션을 트랜잭션으로 감싸므로
--   CREATE INDEX CONCURRENTLY 대신 일반 CREATE UNIQUE INDEX를 사용한다.

-- ============================================================
-- 0. 사전 점검 (마이그레이션 실행 전 아래 쿼리로 중복 데이터를 직접 확인할 것)
--
--   SELECT order_id, COUNT(*)
--   FROM payment WHERE order_id IS NOT NULL
--   GROUP BY order_id HAVING COUNT(*) > 1;
--
--   SELECT pg_tx_id, COUNT(*)
--   FROM payment WHERE pg_tx_id IS NOT NULL
--   GROUP BY pg_tx_id HAVING COUNT(*) > 1;
--
--   SELECT ref_id, reason, COUNT(*)
--   FROM acorn_transaction
--   WHERE ref_id IS NOT NULL AND reason IN ('CHARGE', 'REFUND')
--   GROUP BY ref_id, reason HAVING COUNT(*) > 1;
-- ============================================================


-- ============================================================
-- 1. orders.status — CONFIRMING / CANCELING 상태 추가 후 CHECK 제약
--    기존 데이터는 PENDING | PAID | CANCELED 만 존재하므로 제약 위반 없음
-- ============================================================
ALTER TABLE orders
    ADD CONSTRAINT chk_orders_status
    CHECK (status IN ('PENDING', 'CONFIRMING', 'PAID', 'CANCELING', 'CANCELED'));


-- ============================================================
-- 2. payment 컬럼 추가 — PG 상태와 내부 처리 상태 분리
--    pg_status  : 토스 응답 그대로 ('DONE', 'CANCELED' 등)
--    status     : 내부 처리 상태 (기존 컬럼 재정의, 코드 레벨에서 분리 예정)
--    failure_code: PG 오류 코드 (보정 작업 원인 추적)
--    updated_at : payment 행 변경 시각
-- ============================================================
ALTER TABLE payment
    ADD COLUMN IF NOT EXISTS pg_status   VARCHAR(20),
    ADD COLUMN IF NOT EXISTS failure_code VARCHAR(100),
    ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMP;


-- ============================================================
-- 3. payment 유일성 — 충전 주문 1건당 payment 행 1건, PG 거래 키 중복 방지
--    Partial index: order_id / pg_tx_id 가 NULL인 기존 범용 결제 행은 제외
-- ============================================================
CREATE UNIQUE INDEX uidx_payment_order_id
    ON payment(order_id)
    WHERE order_id IS NOT NULL;

CREATE UNIQUE INDEX uidx_payment_pg_tx_id
    ON payment(pg_tx_id)
    WHERE pg_tx_id IS NOT NULL;


-- ============================================================
-- 4. acorn_transaction 원장 중복 방지
--    동일 주문(ref_id)에 대해 CHARGE / REFUND 원장이 각각 정확히 1건만 기록되도록 보장
--    스케줄러 재시도·멱등 재처리 시에도 중복 삽입 차단
-- ============================================================
CREATE UNIQUE INDEX uidx_acorn_tx_ref_reason
    ON acorn_transaction(ref_id, reason)
    WHERE ref_id IS NOT NULL AND reason IN ('CHARGE', 'REFUND');


-- ============================================================
-- 5. 결제 보정 작업 테이블 (payment_reconciliation_job)
--    PG 호출 결과가 불확실(타임아웃/5xx/내부 처리 실패)할 때 영속화하여
--    스케줄러가 토스 상태 조회 후 멱등적으로 완료 처리한다.
-- ============================================================
CREATE TABLE payment_reconciliation_job (
    job_id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id        BIGINT        NOT NULL REFERENCES orders(order_id),
    operation       VARCHAR(20)   NOT NULL,                          -- CONFIRM | CANCEL
    status          VARCHAR(20)   NOT NULL DEFAULT 'PENDING',        -- PENDING | PROCESSING | DONE | FAILED
    retry_count     INT           NOT NULL DEFAULT 0,
    max_retries     INT           NOT NULL DEFAULT 5,
    next_attempt_at TIMESTAMP     NOT NULL DEFAULT now(),
    locked_at       TIMESTAMP,      -- 다중 인스턴스 중복 실행 방지 (FOR UPDATE SKIP LOCKED 보조)
    last_error      TEXT,           -- 마지막 오류 메시지 (운영 디버깅용)
    created_at      TIMESTAMP     NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP,
    CONSTRAINT chk_job_operation CHECK (operation IN ('CONFIRM', 'CANCEL')),
    CONSTRAINT chk_job_status    CHECK (status   IN ('PENDING', 'PROCESSING', 'DONE', 'FAILED'))
);

-- 스케줄러: 실행 대상 작업 조회 인덱스 (미완료 작업만)
CREATE INDEX idx_reconciliation_job_runnable
    ON payment_reconciliation_job(next_attempt_at, status)
    WHERE status IN ('PENDING', 'PROCESSING');

-- 동일 주문의 활성 보정 작업 중복 생성 방지
-- (order_id, operation) 쌍이 PENDING/PROCESSING 상태로 동시에 2개 이상 존재 불가
-- → SKIP LOCKED 스케줄러 환경에서 동일 작업이 중복 실행되는 것을 DB 레벨에서 차단
CREATE UNIQUE INDEX uidx_reconciliation_job_active
    ON payment_reconciliation_job(order_id, operation)
    WHERE status IN ('PENDING', 'PROCESSING');
