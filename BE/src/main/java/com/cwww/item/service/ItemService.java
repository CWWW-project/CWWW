package com.cwww.item.service;

import com.cwww.item.domain.Item;
import com.cwww.item.dto.ItemPurchaseRequest;
import com.cwww.item.dto.ItemPurchaseResponse;

import java.util.List;

public interface ItemService {

    List<Item> getItems();

    List<Item> find(int page, int size);

    Item findById(Long itemId);

    ItemPurchaseResponse purchaseItems(Long userId, ItemPurchaseRequest request);

    List<Item> findUserInventory(Long userId);
}

