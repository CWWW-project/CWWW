

-- 1. media 소프트 삭제 지원
ALTER TABLE media
    ADD COLUMN deleted_at TIMESTAMP;

-- 2. 미니홈피 도트 배경 색상 컬럼 추가
ALTER TABLE minihompy
    ADD COLUMN background_color VARCHAR(20);
