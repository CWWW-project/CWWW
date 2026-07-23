-- 1. cart 기존 중복 정리
-- 같은 user_id/item_id 조합 중 cart_id가 가장 작은 행만 남김
DELETE FROM cart a
    USING cart b
WHERE a.cart_id > b.cart_id
  AND a.user_id = b.user_id
  AND a.item_id = b.item_id;

-- 2. user_inventory 기존 중복 정리
-- 같은 user_id/item_id 조합 중 id가 가장 작은 행만 남김
DELETE FROM user_inventory a
    USING user_inventory b
WHERE a.id > b.id
  AND a.user_id = b.user_id
  AND a.item_id = b.item_id;

-- 3. cart NULL 데이터 정리
-- user_id/item_id가 NULL인 장바구니 데이터는 정상 구매 흐름에서 사용할 수 없으므로 제거
DELETE FROM cart
WHERE user_id IS NULL
   OR item_id IS NULL;

-- 4. cart user_id/item_id NOT NULL 전환
ALTER TABLE cart
    ALTER COLUMN user_id SET NOT NULL,
    ALTER COLUMN item_id SET NOT NULL;