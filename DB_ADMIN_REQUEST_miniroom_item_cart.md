# DB 관리자 요청사항 - 미니룸/아이템/장바구니

코드에는 이 변경을 Flyway migration으로 직접 추가하지 않았습니다. 아래 항목을 DB 관리자가 dev 기준 migration 또는 DB 설계에 반영해야 합니다.

## item 테이블 확장

```sql
ALTER TABLE item
    ADD COLUMN asset_key VARCHAR(100),
    ADD COLUMN asset_url VARCHAR(512),
    ADD COLUMN asset_width INT,
    ADD COLUMN asset_height INT,
    ADD COLUMN placement_type VARCHAR(20) NOT NULL DEFAULT 'FLOOR';
```

## 중복 방지 제약

```sql
ALTER TABLE cart
    ADD CONSTRAINT uq_cart_user_item UNIQUE (user_id, item_id);

ALTER TABLE user_inventory
    ADD CONSTRAINT uq_user_inventory_user_item UNIQUE (user_id, item_id);
```

## mini_room 배경 표시 컬럼

```sql
ALTER TABLE mini_room
    ADD COLUMN background_asset_key VARCHAR(100),
    ADD COLUMN background_asset_url VARCHAR(512);
```

## 아이템 카테고리 합의값

- `MINIROOM_ITEM`
- `MINIROOM_BACKGROUND`
- `AVATAR`
- `BGM`

기존 개발 seed 또는 임시 데이터에 `MINIROOM`, `BACKGROUND` 값이 있으면 각각 `MINIROOM_ITEM`, `MINIROOM_BACKGROUND`로 정리하는 것을 권장합니다.
