# DB Admin Request - Miniroom Item Cart

## Current dev migration status

Latest `origin/dev` already contains:

- `V6__seed_room_item_dev_data.sql`
  - Adds `item.asset_key`, `item.asset_url`, `item.asset_width`, `item.asset_height`, `item.placement_type`
  - Adds `mini_room.background_asset_key`, `mini_room.background_asset_url`
  - Inserts miniroom development seed data
- `V7__add_acorn_wallet.sql`
  - Creates `acorn_wallet`
  - Migrates `users.acorn_balance` into `acorn_wallet.balance`
  - Drops `users.acorn_balance`

Because `V7` already exists in dev, any new migration should be numbered `V8` or later.

## Remaining DB requests

### 1. Prevent duplicate cart items

```sql
ALTER TABLE cart
    ADD CONSTRAINT uq_cart_user_item UNIQUE (user_id, item_id);
```

Reason:
- The cart must not contain the same item twice for the same user.
- Backend also validates this, but the DB constraint should be the final guard.

### 2. Prevent duplicate owned inventory items

```sql
ALTER TABLE user_inventory
    ADD CONSTRAINT uq_user_inventory_user_item UNIQUE (user_id, item_id);
```

Reason:
- A user should not own the same item twice.
- Backend blocks duplicate purchases, but this constraint prevents race-condition duplicates.

### 3. Confirm item category values

Preferred final category values:

- `MINIROOM_ITEM`
- `MINIROOM_BACKGROUND`
- `AVATAR`
- `BGM`

Current `V6` seed uses legacy values:

- `MINIROOM`
- `BACKGROUND`
- `AVATAR`

The frontend/backend currently accepts both legacy and preferred values for compatibility. DB admin should decide whether to keep legacy values or normalize them with a later migration.

Suggested normalization if approved:

```sql
UPDATE item
SET category = 'MINIROOM_ITEM'
WHERE category = 'MINIROOM';

UPDATE item
SET category = 'MINIROOM_BACKGROUND'
WHERE category = 'BACKGROUND';
```

### 4. Cart purchase and acorn wallet

Purchase code now uses:

- `acorn_wallet.balance`
- not `users.acorn_balance`

No DB change is required for this beyond the existing `V7`, but DB admin should confirm whether item purchases should also insert an `acorn_transaction` row with a negative amount for spending history.
