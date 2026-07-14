package com.cwww.item.service;

import com.cwww.item.dto.InventoryItemResponse;
import com.cwww.item.dto.ItemResponse;
import com.cwww.item.dto.PurchaseResponse;

import java.util.List;

public interface ItemService {

    List<ItemResponse> getItems(String category);

    List<InventoryItemResponse> getInventory(Long userId);

    PurchaseResponse purchaseItem(Long userId, Long itemId);
}
