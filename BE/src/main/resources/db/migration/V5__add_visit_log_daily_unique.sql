-- V5__add_visit_log_daily_unique.sql
-- 같은 유저가 하루에 여러 번 방문해도 visit_log에 중복 기록되지 않도록 방지
-- (minihompy_id, visitor_id, 방문 날짜) 조합으로 유니크 제약
-- 비로그인 방문(visitor_id IS NULL)은 중복 판단 불가하므로 제외 (서비스 로직에서 비로그인 방문 기록 insert 막음, 추후 비로그인도 추가하고 싶을 경우를 위해 남겨둠)
CREATE UNIQUE INDEX uq_visit_log_daily
    ON visit_log (minihompy_id, visitor_id, (visited_at::date))
    WHERE visitor_id IS NOT NULL;