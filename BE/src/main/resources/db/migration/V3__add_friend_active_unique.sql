-- 활성 상태(PENDING/ACCEPTED)인 일촌 쌍의 중복 신청을 DB 레벨에서 방지
-- LEAST/GREATEST로 (A→B)와 (B→A)를 동일 쌍으로 취급
CREATE UNIQUE INDEX uq_friend_active_pair
    ON friend (LEAST(requester_id, receiver_id), GREATEST(requester_id, receiver_id))
    WHERE status IN ('PENDING', 'ACCEPTED');
