-- 지갑이 없는 기존 유저에게 acorn_wallet 레코드 생성 (잔액 0으로 초기화)
INSERT INTO acorn_wallet (user_id, balance)
SELECT u.user_id, 0
FROM users u
ON CONFLICT (user_id) DO NOTHING;
