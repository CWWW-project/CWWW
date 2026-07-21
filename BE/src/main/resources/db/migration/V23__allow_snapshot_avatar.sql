ALTER TABLE avatar
    ADD COLUMN IF NOT EXISTS snapshot_asset_key VARCHAR(100),
    ADD COLUMN IF NOT EXISTS snapshot_asset_url VARCHAR(512),
    ADD COLUMN IF NOT EXISTS snapshot_asset_width INT,
    ADD COLUMN IF NOT EXISTS snapshot_asset_height INT;
