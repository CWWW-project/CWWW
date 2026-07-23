-- V18에서 email/nickname은 탈퇴 계정 재사용 가능하도록 부분 유니크 인덱스로 바꿨는데,
-- 같은 시점에 만들어진 uq_users_provider(V12)는 deleted_at 조건 없이 남아있었음.
-- 그 결과 소셜 계정으로 가입 후 탈퇴한 유저는 같은 소셜 계정으로 다시는
-- 연동/재가입할 수 없었음(탈퇴한 row가 provider+provider_id를 영구히 점유).

ALTER TABLE users DROP CONSTRAINT uq_users_provider;

CREATE UNIQUE INDEX uq_users_provider_active
    ON users (provider, provider_id)
    WHERE deleted_at IS NULL;
