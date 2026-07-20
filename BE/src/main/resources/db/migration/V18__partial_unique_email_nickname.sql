-- 탈퇴(소프트 삭제)한 계정의 이메일/닉네임을 재사용할 수 있도록,
-- 전체 대상 UNIQUE 제약을 deleted_at IS NULL 조건의 부분 유니크 인덱스로 교체.
-- 기존 제약은 deleted_at 여부와 상관없이 걸려있어서, 탈퇴한 계정과 같은
-- 이메일/닉네임으로는 재가입이 영구히 불가능했음.

ALTER TABLE users DROP CONSTRAINT users_email_key;
ALTER TABLE users DROP CONSTRAINT users_nickname_key;

CREATE UNIQUE INDEX uq_users_email_active
    ON users (email)
    WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX uq_users_nickname_active
    ON users (nickname)
    WHERE deleted_at IS NULL;
