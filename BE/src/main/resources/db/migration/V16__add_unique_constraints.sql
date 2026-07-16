

-- ============================================================
-- 사전 확인
-- 아래 조건에 해당하는 중복 데이터가 존재하면 Unique Index 생성이 실패합니다.
-- 마이그레이션 실행 전 중복 여부를 확인하고, 필요한 경우 데이터를 정리한 후 실행합니다.
--
-- 1. media(target_type='PROFILE', deleted_at IS NULL)
--    target_id 중복 여부 확인
--
--    SELECT target_id, COUNT(*) AS duplicate_count
--    FROM media
--    WHERE target_type = 'PROFILE'
--      AND deleted_at IS NULL
--    GROUP BY target_id
--    HAVING COUNT(*) > 1;
--
-- 2. media(target_type='BACKGROUND', deleted_at IS NULL)
--    target_id 중복 여부 확인
--
--    SELECT target_id, COUNT(*) AS duplicate_count
--    FROM media
--    WHERE target_type = 'BACKGROUND'
--      AND deleted_at IS NULL
--    GROUP BY target_id
--    HAVING COUNT(*) > 1;
--
-- 3. item(category='BGM')
--    name 중복 여부 확인
--
--    SELECT name, COUNT(*) AS duplicate_count
--    FROM item
--    WHERE category = 'BGM'
--    GROUP BY name
--    HAVING COUNT(*) > 1;
-- ============================================================

-- 1. 프로필 사진 singleton 보장
CREATE UNIQUE INDEX uq_media_profile_singleton
    ON media (target_id)
    WHERE target_type = 'PROFILE'
        AND deleted_at IS NULL;

-- 2. 배경화면 singleton 보장
CREATE UNIQUE INDEX uq_media_background_singleton
    ON media (target_id)
    WHERE target_type = 'BACKGROUND'
        AND deleted_at IS NULL;

-- 3. BGM 아이템 이름 중복 방지
CREATE UNIQUE INDEX uq_item_bgm_name
    ON item (name)
    WHERE category = 'BGM';
