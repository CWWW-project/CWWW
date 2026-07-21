-- 지갑이 없는 기존 유저에게 acorn_wallet 레코드 생성 (잔액 0으로 초기화)
INSERT INTO acorn_wallet (user_id, balance)
SELECT u.user_id, 0
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM acorn_wallet w WHERE w.user_id = u.user_id
);
