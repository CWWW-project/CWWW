-- V5: development seed data for item purchase and mini room API checks.

ALTER TABLE item
    ADD COLUMN IF NOT EXISTS asset_key VARCHAR(100),
    ADD COLUMN IF NOT EXISTS asset_url VARCHAR(512),
    ADD COLUMN IF NOT EXISTS asset_width INT,
    ADD COLUMN IF NOT EXISTS asset_height INT,
    ADD COLUMN IF NOT EXISTS placement_type VARCHAR(20) NOT NULL DEFAULT 'FLOOR';

ALTER TABLE mini_room
    ADD COLUMN IF NOT EXISTS background_asset_key VARCHAR(100),
    ADD COLUMN IF NOT EXISTS background_asset_url VARCHAR(512);

INSERT INTO users (
    email,
    password,
    nickname,
    role,
    status,
    created_at,
    updated_at,
    acorn_balance
)
VALUES (
    'miniroom-dev@example.com',
    '{noop}password',
    'miniroom_dev',
    'USER',
    'ACTIVE',
    NOW(),
    NOW(),
    5000
)
ON CONFLICT (email) DO UPDATE
SET acorn_balance = GREATEST(users.acorn_balance, 5000),
    updated_at = NOW();

INSERT INTO users (
    email,
    password,
    nickname,
    role,
    status,
    created_at,
    updated_at,
    acorn_balance
)
VALUES (
    'cwww-test@example.com',
    '$2a$10$sBZYCzpGd0utUm0FdBIfje8GLQ01PzMWi2gR39DdbUg9HFI99tIMi',
    'cwww_test',
    'USER',
    'ACTIVE',
    NOW(),
    NOW(),
    1000000
)
ON CONFLICT (email) DO UPDATE
SET password = EXCLUDED.password,
    nickname = EXCLUDED.nickname,
    status = 'ACTIVE',
    acorn_balance = GREATEST(users.acorn_balance, 1000000),
    updated_at = NOW();

INSERT INTO minihompy (
    user_id,
    title,
    introduction,
    mood,
    created_at
)
SELECT
    u.user_id,
    'miniroom_dev home',
    'Development seed home',
    'GOOD',
    NOW()
FROM users u
WHERE u.email = 'miniroom-dev@example.com'
  AND NOT EXISTS (
      SELECT 1
      FROM minihompy mh
      WHERE mh.user_id = u.user_id
  );

INSERT INTO minihompy (
    user_id,
    title,
    introduction,
    mood,
    created_at
)
SELECT
    u.user_id,
    'cwww_test home',
    'Development test home',
    'GOOD',
    NOW()
FROM users u
WHERE u.email = 'cwww-test@example.com'
  AND NOT EXISTS (
      SELECT 1
      FROM minihompy mh
      WHERE mh.user_id = u.user_id
  );

INSERT INTO item (
    category,
    name,
    description,
    price,
    status,
    sales_count,
    creator_id,
    created_at,
    updated_at
)
SELECT
    seed.category,
    seed.name,
    seed.description,
    seed.price,
    'ACTIVE',
    0,
    u.user_id,
    NOW(),
    NOW()
FROM users u
CROSS JOIN (
    VALUES
        ('MINIROOM', 'Classic Sofa', 'Mini room sofa item', 300),
        ('MINIROOM', 'Wood Desk', 'Mini room desk item', 250),
        ('MINIROOM', 'Floor Lamp', 'Mini room lamp item', 150),
        ('BACKGROUND', 'Blue Room Background', 'Default blue room background', 500),
        ('AVATAR', 'Basic MiniMe', 'Default avatar item', 700)
) AS seed(category, name, description, price)
WHERE u.email = 'miniroom-dev@example.com'
  AND NOT EXISTS (
      SELECT 1
      FROM item i
      WHERE i.name = seed.name
        AND i.creator_id = u.user_id
  );

INSERT INTO user_inventory (
    user_id,
    item_id,
    acquired_at
)
SELECT
    u.user_id,
    i.item_id,
    NOW()
FROM users u
JOIN item i ON i.creator_id = u.user_id
WHERE u.email = 'miniroom-dev@example.com'
  AND i.name IN ('Classic Sofa', 'Blue Room Background', 'Basic MiniMe')
  AND NOT EXISTS (
      SELECT 1
      FROM user_inventory ui
      WHERE ui.user_id = u.user_id
        AND ui.item_id = i.item_id
  );

INSERT INTO mini_room (
    user_id,
    background_inventory_id,
    max_item_count,
    layout_version,
    created_at,
    updated_at
)
SELECT
    u.user_id,
    bg.id,
    50,
    0,
    NOW(),
    NOW()
FROM users u
LEFT JOIN item bg_item
    ON bg_item.creator_id = u.user_id
   AND bg_item.name = 'Blue Room Background'
LEFT JOIN user_inventory bg
    ON bg.user_id = u.user_id
   AND bg.item_id = bg_item.item_id
WHERE u.email = 'miniroom-dev@example.com'
  AND NOT EXISTS (
      SELECT 1
      FROM mini_room mr
      WHERE mr.user_id = u.user_id
  );

INSERT INTO avatar (
    user_id,
    avatar_inventory_id,
    pos_x,
    pos_y,
    scale,
    flipped,
    created_at,
    updated_at
)
SELECT
    u.user_id,
    avatar_inventory.id,
    45,
    55,
    1.00,
    FALSE,
    NOW(),
    NOW()
FROM users u
JOIN item avatar_item
    ON avatar_item.creator_id = u.user_id
   AND avatar_item.name = 'Basic MiniMe'
JOIN user_inventory avatar_inventory
    ON avatar_inventory.user_id = u.user_id
   AND avatar_inventory.item_id = avatar_item.item_id
WHERE u.email = 'miniroom-dev@example.com'
  AND NOT EXISTS (
      SELECT 1
      FROM avatar a
      WHERE a.user_id = u.user_id
  );

INSERT INTO mini_room_item (
    mini_room_id,
    user_inventory_id,
    pos_x,
    pos_y,
    rotation,
    flipped,
    scale,
    sort_order,
    locked,
    created_at,
    updated_at
)
SELECT
    mr.id,
    sofa_inventory.id,
    35,
    60,
    0,
    FALSE,
    1.00,
    1,
    FALSE,
    NOW(),
    NOW()
FROM users u
JOIN mini_room mr ON mr.user_id = u.user_id
JOIN item sofa_item
    ON sofa_item.creator_id = u.user_id
   AND sofa_item.name = 'Classic Sofa'
JOIN user_inventory sofa_inventory
    ON sofa_inventory.user_id = u.user_id
   AND sofa_inventory.item_id = sofa_item.item_id
WHERE u.email = 'miniroom-dev@example.com'
  AND NOT EXISTS (
      SELECT 1
      FROM mini_room_item mri
      WHERE mri.mini_room_id = mr.id
        AND mri.user_inventory_id = sofa_inventory.id
  );

UPDATE item
SET asset_key = 'sofa_blue',
    asset_url = '/miniroom-assets/items/sofa_blue.png',
    asset_width = 126,
    asset_height = 126,
    placement_type = 'FLOOR'
WHERE name = 'Classic Sofa';

UPDATE item
SET asset_key = 'desk_se',
    asset_url = '/miniroom-assets/kenney/isometric/desk_SE.png',
    asset_width = 85,
    asset_height = 88,
    placement_type = 'FLOOR'
WHERE name = 'Wood Desk';

UPDATE item
SET asset_key = 'floor_lamp_orange',
    asset_url = '/miniroom-assets/items/floor_lamp_orange.png',
    asset_width = 126,
    asset_height = 126,
    placement_type = 'FLOOR'
WHERE name = 'Floor Lamp';

UPDATE item
SET asset_key = 'room_blue',
    asset_url = '/miniroom-assets/rooms/room-blue.svg',
    asset_width = 750,
    asset_height = 606,
    placement_type = 'BACKGROUND'
WHERE name = 'Blue Room Background';

UPDATE item
SET asset_key = 'grafxkid_avatar_01',
    asset_url = '/miniroom-assets/avatars-grafxkid/grafxkid_avatar_01.png',
    asset_width = 36,
    asset_height = 56,
    placement_type = 'FLOOR'
WHERE name = 'Basic MiniMe';

UPDATE mini_room
SET background_asset_key = 'room-pink',
    background_asset_url = '/miniroom-assets/rooms/room-pink.svg'
WHERE background_asset_key IS NULL;
