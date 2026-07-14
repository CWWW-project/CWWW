-- V4__update_minihompy_table.sql
-- 미니홈피(minihompy) 테이블 컬럼/제약조건 추가

-- 1. 공개 범위 컬럼 추가 (ALL/FRIEND/PRIVATE)
ALTER TABLE minihompy
    ADD COLUMN access_level VARCHAR(20);

-- 2. 기존 행(컬럼 추가 이전에 만들어진 미니홈피)들의 NULL을 기본값 'ALL'로 백필
UPDATE minihompy
SET access_level = 'ALL'
WHERE access_level IS NULL;

-- 3. 앞으로 생성되는 행도 기본값 'ALL' + NULL 금지
ALTER TABLE minihompy
    ALTER COLUMN access_level SET DEFAULT 'ALL',
    ALTER COLUMN access_level SET NOT NULL;

-- 4. user_id UNIQUE 제약 추가
-- 미니홈피는 유저 1명당 1개만 존재해야 하므로 1:1 관계 보장
ALTER TABLE minihompy
    ADD CONSTRAINT uq_minihompy_user_id UNIQUE (user_id);

-- 5. media_id FK 제약 추가
-- 미니홈피에 설정된 BGM(media_id)이 실제 media 테이블에 존재하는 값인지 보장
ALTER TABLE minihompy
    ADD CONSTRAINT fk_minihompy_media FOREIGN KEY (media_id) REFERENCES media(media_id);