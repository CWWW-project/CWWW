package com.cwww.item.service;

import com.cwww.global.exception.BusinessException;
import com.cwww.global.exception.ErrorCode;
import com.cwww.item.domain.Item;
import com.cwww.item.domain.ItemPurchase;
import com.cwww.item.domain.UserInventory;
import com.cwww.item.dto.InventoryItemResponse;
import com.cwww.item.dto.ItemResponse;
import com.cwww.item.dto.PurchaseResponse;
import com.cwww.item.mapper.ItemMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ItemServiceImpl implements ItemService {

    private static final String PURCHASE_COMPLETED = "COMPLETED";

    private final ItemMapper itemMapper;

    @Override
    @Transactional(readOnly = true)
    public List<ItemResponse> getItems(String category) {
        return itemMapper.selectItems(category).stream()
                .map(ItemResponse::from)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<InventoryItemResponse> getInventory(Long userId) {
        validateUserId(userId);
        return itemMapper.selectInventoryByUserId(userId);
    }

    @Override
    @Transactional
    public PurchaseResponse purchaseItem(Long userId, Long itemId) {
        validateUserId(userId);
        if (itemId == null) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }

        Item item = itemMapper.selectItemById(itemId);
        if (item == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND);
        }

        Integer price = item.getPrice();
        if (price == null || price < 0) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }

        int updatedRows = itemMapper.decreaseAcornBalance(userId, price);
        if (updatedRows == 0) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }

        ItemPurchase purchase = new ItemPurchase();
        purchase.setUserId(userId);
        purchase.setItemId(itemId);
        purchase.setAcornPrice(price);
        purchase.setStatus(PURCHASE_COMPLETED);
        itemMapper.insertItemPurchase(purchase);

        UserInventory inventory = new UserInventory();
        inventory.setUserId(userId);
        inventory.setItemId(itemId);
        itemMapper.insertUserInventory(inventory);

        itemMapper.increaseSalesCount(itemId);
        Integer remainingAcorns = itemMapper.selectAcornBalance(userId);

        return PurchaseResponse.builder()
                .purchaseId(purchase.getPurchaseId())
                .inventoryId(inventory.getId())
                .remainingAcorns(remainingAcorns)
                .build();
    }

    private void validateUserId(Long userId) {
        if (userId == null) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
    }
}
