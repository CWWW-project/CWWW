package com.cwww.item.service;

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
        int offset = (page-1)*size;                   // ← 공식, 직접!
        return itemMapper.find(size, offset);    // ← 순서: size 먼저, offset 나중
    }
}