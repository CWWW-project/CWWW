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

    List<Item> findAll();
    List<Item> find(@Param("category") String category, @Param("size") int size, @Param("offset") long offset);
    int countAll();

    Item findById(@Param("itemId") Long itemId);

    List<InventoryItemResponse> selectInventoryByUserId(@Param("userId") Long userId,
                                                         @Param("category") String category);

    Integer selectAcornBalance(@Param("userId") Long userId);

    int decreaseAcornBalance(@Param("userId") Long userId, @Param("price") Integer price);

    int existsInventoryItem(@Param("userId") Long userId, @Param("itemId") Long itemId);

    void insertItemPurchase(ItemPurchase itemPurchase);

    void insertUserInventory(UserInventory userInventory);

    void increaseSalesCount(@Param("itemId") Long itemId);
}
