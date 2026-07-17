package com.cwww.item.service;

import com.cwww.global.exception.BusinessException;
import com.cwww.global.exception.ErrorCode;
import com.cwww.item.domain.Item;
import com.cwww.item.mapper.ItemMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ItemServiceImpl implements ItemService {

    private final ItemMapper itemMapper;

    @Override
    public List<Item> getItems() {
        return itemMapper.findAll();
    }

    @Override
    public List<Item> find(int page, int size) {
        long offset = (long) (page - 1) * size;
        return itemMapper.find(size, offset);
    }

    @Override
    public Item findById(Long itemId) {
        Item item = itemMapper.findById(itemId);
        if (item == null) {
            throw new BusinessException(ErrorCode.ITEM_NOT_FOUND);
        }
        return item;
    }
}