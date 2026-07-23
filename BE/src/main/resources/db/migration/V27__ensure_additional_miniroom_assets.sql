WITH creator AS (
    SELECT creator_id
    FROM item
    WHERE creator_id IS NOT NULL
    ORDER BY item_id
    LIMIT 1
),
seed(category, name, asset_key, asset_url, asset_width, asset_height, placement_type) AS (
    VALUES
        ('MINIROOM', '블루 도트 침대', 'bed_blue_dots', '/miniroom-assets/items/bed_blue_dots.png', 91, 69, 'FLOOR'),
        ('MINIROOM', '불닭볶음면', 'buldak_ramen', '/miniroom-assets/items/buldak_ramen.png', 236, 208, 'FLOOR'),
        ('MINIROOM', '캠핑 의자', 'camping_chair', '/miniroom-assets/items/camping_chair.png', 58, 82, 'FLOOR'),
        ('MINIROOM', '캠핑 테이블', 'camping_table', '/miniroom-assets/items/camping_table.png', 83, 66, 'FLOOR'),
        ('MINIROOM', '원목 의자', 'chair', '/miniroom-assets/items/chair.png', 663, 718, 'FLOOR'),
        ('MINIROOM', '심플 벽시계', 'clock_wall_simple', '/miniroom-assets/items/clock_wall_simple.png', 78, 83, 'WALL'),
        ('MINIROOM', '타원형 커피 테이블', 'coffee_table_oval', '/miniroom-assets/items/coffee_table_oval.png', 77, 52, 'FLOOR'),
        ('MINIROOM', '블랙 컵', 'cup_black', '/miniroom-assets/items/cup_black.png', 50, 70, 'FLOOR'),
        ('MINIROOM', '진열 냉장고', 'display_refrigerator', '/miniroom-assets/items/display_refrigerator.png', 62, 78, 'FLOOR'),
        ('MINIROOM', '원목 서랍장', 'drawer_chest', '/miniroom-assets/items/drawer_chest.png', 60, 77, 'FLOOR'),
        ('MINIROOM', '인덕션', 'induction_cooktop', '/miniroom-assets/items/induction_cooktop.png', 91, 53, 'FLOOR'),
        ('MINIROOM', '골드 전신 거울', 'mirror_full_gold', '/miniroom-assets/items/mirror_full_gold.png', 36, 89, 'WALL'),
        ('MINIROOM', '라운드 펜던트 조명', 'pendant_light_round', '/miniroom-assets/items/pendant_light_round.png', 44, 84, 'WALL'),
        ('MINIROOM', '화분', 'potted_plant', '/miniroom-assets/items/potted_plant.png', 32, 92, 'FLOOR'),
        ('MINIROOM', '전기밥솥', 'rice_cooker', '/miniroom-assets/items/rice_cooker.png', 192, 235, 'FLOOR'),
        ('MINIROOM', '스트라이프 러그', 'rug_striped', '/miniroom-assets/items/rug_striped.png', 95, 45, 'FLOOR'),
        ('MINIROOM', '원목 선반', 'shelf_wood', '/miniroom-assets/items/shelf_wood.png', 73, 67, 'WALL'),
        ('MINIROOM', '신라면', 'shin_ramen', '/miniroom-assets/items/shin_ramen.png', 236, 198, 'FLOOR'),
        ('MINIROOM', 'TV 모니터', 'tv_monitor', '/miniroom-assets/items/tv_monitor.png', 68, 60, 'FLOOR'),
        ('MINIROOM', '나뭇잎 벽 액자', 'wall_frame_leaf', '/miniroom-assets/items/wall_frame_leaf.png', 72, 57, 'WALL'),
        ('MINIROOM', '검정 장갑', 'black_gloves', '/miniroom-assets/items/검정장갑.png', 143, 236, 'FLOOR'),
        ('MINIROOM', '귀여운 다마고찌', 'cute_tamagotchi', '/miniroom-assets/items/다마고찌_귀여운_버전.png', 227, 236, 'FLOOR'),
        ('MINIROOM', '명품 가방', 'luxury_bag', '/miniroom-assets/items/명품가방.png', 236, 205, 'FLOOR'),
        ('MINIROOM', '손목 장갑', 'wrist_gloves', '/miniroom-assets/items/손목장갑.png', 235, 174, 'FLOOR'),
        ('MINIROOM', '아이맥', 'imac', '/miniroom-assets/items/아이맥.png', 236, 190, 'FLOOR'),
        ('MINIROOM', '프라다 명품백', 'prada_luxury_bag', '/miniroom-assets/items/프라다명품백.png', 236, 201, 'FLOOR'),
        ('MINIROOM', '퍼플 북', 'special_book_purple', '/miniroom-assets/special/book_purple.png', 77, 69, 'FLOOR'),
        ('MINIROOM', '오렌지 캠핑 텐트', 'special_camping_tent_orange', '/miniroom-assets/special/camping_tent_orange.png', 97, 58, 'FLOOR'),
        ('MINIROOM', '하얀 고양이', 'special_cat_white', '/miniroom-assets/special/cat_white.png', 73, 69, 'FLOOR'),
        ('MINIROOM', '황금 왕관', 'special_crown_gold', '/miniroom-assets/special/crown_gold.png', 73, 47, 'FLOOR'),
        ('MINIROOM', '오렌지 햄스터', 'special_hamster_orange', '/miniroom-assets/special/hamster_orange.png', 58, 75, 'FLOOR'),
        ('MINIROOM', '하얀 강아지', 'special_puppy_white', '/miniroom-assets/special/puppy_white.png', 66, 88, 'FLOOR'),
        ('MINIROOM', '하얀 토끼', 'special_rabbit_white', '/miniroom-assets/special/rabbit_white.png', 53, 85, 'FLOOR'),
        ('MINIROOM', '우주 로켓', 'special_rocket', '/miniroom-assets/special/rocket.png', 53, 74, 'FLOOR'),
        ('MINIROOM', '장미 유리돔', 'special_rose_dome', '/miniroom-assets/special/rose_dome.png', 50, 89, 'FLOOR'),
        ('BACKGROUND', '클래식 룸 배경', 'background_classic_room', '/miniroom-assets/backgrounds/bg_room.png', 750, 606, 'BACKGROUND'),
        ('BACKGROUND', '꽃밭 잔디 배경', 'background_flower_grass', '/miniroom-assets/backgrounds/bg_grass.png', 750, 612, 'BACKGROUND'),
        ('BACKGROUND', '우주 행성 배경', 'background_universe', '/miniroom-assets/backgrounds/bg_universe.png', 750, 606, 'BACKGROUND')
)
INSERT INTO item (
    category,
    name,
    description,
    price,
    status,
    sales_count,
    creator_id,
    asset_key,
    asset_url,
    asset_width,
    asset_height,
    placement_type,
    created_at,
    updated_at
)
SELECT
    seed.category,
    seed.name,
    CASE
        WHEN seed.category = 'BACKGROUND' THEN '구매 가능한 미니룸 배경'
        WHEN seed.asset_key LIKE 'special_%' THEN '구매 가능한 스페셜 미니룸 아이템'
        ELSE '구매 가능한 미니룸 아이템'
    END,
    CASE
        WHEN seed.category = 'BACKGROUND' THEN 500
        WHEN seed.asset_key LIKE 'special_%' THEN 700
        ELSE 400
    END,
    'ACTIVE',
    0,
    creator.creator_id,
    seed.asset_key,
    seed.asset_url,
    seed.asset_width,
    seed.asset_height,
    seed.placement_type,
    NOW(),
    NOW()
FROM seed
CROSS JOIN creator
WHERE NOT EXISTS (
    SELECT 1
    FROM item i
    WHERE i.asset_key = seed.asset_key
       OR i.asset_url = seed.asset_url
);
