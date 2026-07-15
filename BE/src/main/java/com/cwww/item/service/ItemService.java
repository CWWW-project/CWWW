package com.cwww.item.service;

import com.cwww.item.domain.Item;
import com.cwww.item.dto.InventoryItemResponse;
import com.cwww.item.dto.PurchaseResponse;

import java.util.List;

public interface ItemService {

    List<Item> getItems();

    List<Item> find(String category, int page, int size);

    Item findById(Long itemId);

    List<InventoryItemResponse> getInventory(Long userId, String category);

    PurchaseResponse purchaseItem(Long userId, Long itemId);
}


