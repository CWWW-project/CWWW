ALTER TABLE mini_room_item
    ALTER COLUMN user_inventory_id DROP NOT NULL,
    ADD COLUMN IF NOT EXISTS snapshot_category VARCHAR(50),
    ADD COLUMN IF NOT EXISTS snapshot_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS snapshot_asset_key VARCHAR(100),
    ADD COLUMN IF NOT EXISTS snapshot_asset_url VARCHAR(512),
    ADD COLUMN IF NOT EXISTS snapshot_asset_width INT,
    ADD COLUMN IF NOT EXISTS snapshot_asset_height INT,
    ADD COLUMN IF NOT EXISTS snapshot_placement_type VARCHAR(20);
