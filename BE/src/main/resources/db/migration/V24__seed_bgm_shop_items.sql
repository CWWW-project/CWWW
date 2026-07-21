WITH seed(name, description, price, media_url) AS (
    VALUES
        ('달빛 산책 - 루프 BGM', '미니홈피에 어울리는 잔잔한 산책 분위기의 BGM', 300, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'),
        ('오렌지 소다 - 루프 BGM', '상큼하고 가벼운 팝 분위기의 BGM', 300, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'),
        ('새벽 다이어리 - 루프 BGM', '조용한 새벽 감성의 미니홈피 BGM', 300, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'),
        ('레트로 로그인 - 루프 BGM', '싸이월드 감성을 떠올리게 하는 레트로 BGM', 300, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3'),
        ('구름 위 방명록 - 루프 BGM', '포근한 홈피 분위기를 만드는 밝은 BGM', 300, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3')
),
inserted AS (
    INSERT INTO item (
        category,
        name,
        description,
        price,
        status,
        sales_count,
        creator_id,
        placement_type,
        created_at,
        updated_at
    )
    SELECT
        'BGM',
        seed.name,
        seed.description,
        seed.price,
        'ACTIVE',
        0,
        u.user_id,
        'FLOOR',
        NOW(),
        NOW()
    FROM seed
    CROSS JOIN users u
    WHERE u.email = 'miniroom-dev@example.com'
    ON CONFLICT (name) WHERE category = 'BGM'
    DO UPDATE SET
        description = EXCLUDED.description,
        price = EXCLUDED.price,
        status = 'ACTIVE',
        updated_at = NOW()
    RETURNING item_id, name
)
INSERT INTO media (
    target_type,
    target_id,
    media_url,
    created_at
)
SELECT
    'BGM',
    inserted.item_id,
    seed.media_url,
    NOW()
FROM inserted
JOIN seed ON seed.name = inserted.name
WHERE NOT EXISTS (
    SELECT 1
    FROM media m
    WHERE m.target_type = 'BGM'
      AND m.target_id = inserted.item_id
      AND m.deleted_at IS NULL
);
