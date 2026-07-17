package com.cwww.item.mapper;

import com.cwww.item.domain.Item;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface ItemMapper {

    List<Item> findAll();
    List<Item> find(@Param("size") int size, @Param("offset") long offset);
    int countAll();

    Item findById(@Param("itemId") Long itemId);

    List<Item> findByIds(@Param("itemIds") List<Long> itemIds);

    /** 이미 보유한 아이템 ID 목록 반환 — 중복 구매 체크용 */
    List<Long> findOwnedItemIds(@Param("userId") Long userId,
                                @Param("itemIds") List<Long> itemIds);

    /** 인벤토리 삽입 — uq_user_inventory_user_item 충돌 시 DO NOTHING */
    void insertUserInventory(@Param("userId") Long userId, @Param("itemId") Long itemId);

    List<Item> findUserInventory(@Param("userId") Long userId);
}