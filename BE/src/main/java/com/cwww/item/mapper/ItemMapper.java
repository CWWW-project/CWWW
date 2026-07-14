package com.cwww.item.mapper;

import com.cwww.item.domain.Item;
import com.cwww.item.domain.ItemPurchase;
import com.cwww.item.domain.UserInventory;
import com.cwww.item.dto.InventoryItemResponse;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ItemMapper {

    List<Item> selectItems(@Param("category") String category);

    Item selectItemById(@Param("itemId") Long itemId);

    List<InventoryItemResponse> selectInventoryByUserId(@Param("userId") Long userId);

    Integer selectAcornBalance(@Param("userId") Long userId);

    int decreaseAcornBalance(@Param("userId") Long userId, @Param("price") Integer price);

    void insertItemPurchase(ItemPurchase itemPurchase);

    void insertUserInventory(UserInventory userInventory);

    void increaseSalesCount(@Param("itemId") Long itemId);
}
