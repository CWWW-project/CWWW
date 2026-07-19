package com.cwww.item.service;

import com.cwww.item.dto.InventoryItemResponse;
import com.cwww.item.dto.ItemResponse;
import com.cwww.item.dto.PurchaseResponse;

import java.util.List;

public interface ItemService {

    List<ItemResponse> getItems();

    List<ItemResponse> find(String category, int page, int size);

    ItemResponse findById(Long itemId);

    List<InventoryItemResponse> getInventory(Long userId, String category);

    PurchaseResponse purchaseItem(Long userId, Long itemId);
}


