package com.cwww.item.service;

import com.cwww.item.domain.Item;

import java.util.List;

public interface ItemService {

    List<Item> getItems();

    List<Item> find(int page, int size);

    Item findById(Long itemId);
}


