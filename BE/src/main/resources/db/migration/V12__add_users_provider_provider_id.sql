SELECT provider, provider_id, COUNT(*)
FROM users
WHERE provider IS NOT NULL
GROUP BY provider, provider_id
HAVING COUNT(*) > 1;

-- 제약추가
ALTER TABLE users

    ADD CONSTRAINT uq_users_provider UNIQUE (provider, provider_id);
