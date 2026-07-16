-- 장바구니 동일 아이템 중복 담기 방지
ALTER TABLE cart
    ADD CONSTRAINT uq_cart_user_item UNIQUE (user_id, item_id);

-- 보유 아이템 중복 보유 방지
ALTER TABLE user_inventory
    ADD CONSTRAINT uq_user_inventory_user_item UNIQUE (user_id, item_id);