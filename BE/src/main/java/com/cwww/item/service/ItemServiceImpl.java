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
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ItemServiceImpl implements ItemService {

    private static final String PURCHASE_COMPLETED = "COMPLETED";

    private final ItemMapper itemMapper;

    @Override
    @Transactional(readOnly = true)
    public List<ItemResponse> getItems() {
        return itemMapper.findAll().stream()
                .map(ItemResponse::from)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ItemResponse> find(String category, int page, int size) {
        long offset = (long) (page - 1) * size;
        return itemMapper.find(normalizeCategory(category), size, offset).stream()
                .map(ItemResponse::from)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ItemResponse findById(Long itemId) {
        return ItemResponse.from(getItemOrThrow(itemId));
    }

    private Item getItemOrThrow(Long itemId) {
        Item item = itemMapper.findById(itemId);
        if (item == null) {
            throw new BusinessException(ErrorCode.ITEM_NOT_FOUND);
        }
        return item;
    }

    @Override
    @Transactional(readOnly = true)
    public List<InventoryItemResponse> getInventory(Long userId, String category) {
        validateUserId(userId);
        return itemMapper.selectInventoryByUserId(userId, normalizeCategory(category));
    }

    @Override
    @Transactional
    public PurchaseResponse purchaseItem(Long userId, Long itemId) {
        validateUserId(userId);
        Item item = getItemOrThrow(itemId);
        validatePurchasable(userId, item);

        int updatedRows = itemMapper.decreaseAcornBalance(userId, item.getPrice());
        if (updatedRows == 0) {
            throw new BusinessException(ErrorCode.INSUFFICIENT_ACORNS);
        }

        ItemPurchase purchase = new ItemPurchase();
        purchase.setUserId(userId);
        purchase.setItemId(item.getItemId());
        purchase.setAcornPrice(item.getPrice());
        purchase.setStatus(PURCHASE_COMPLETED);
        itemMapper.insertItemPurchase(purchase);

        UserInventory inventory = new UserInventory();
        inventory.setUserId(userId);
        inventory.setItemId(item.getItemId());
        try {
            itemMapper.insertUserInventory(inventory);
        } catch (DuplicateKeyException e) {
            throw new BusinessException(ErrorCode.DUPLICATE_RESOURCE);
        }

        itemMapper.increaseSalesCount(item.getItemId());

        return PurchaseResponse.builder()
                .purchaseId(purchase.getPurchaseId())
                .inventoryId(inventory.getId())
                .remainingAcorns(itemMapper.selectAcornBalance(userId))
                .build();
    }

    private void validatePurchasable(Long userId, Item item) {
        Integer price = item.getPrice();
        if (price == null || price < 0) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
        if (itemMapper.existsInventoryItem(userId, item.getItemId()) > 0) {
            throw new BusinessException(ErrorCode.DUPLICATE_RESOURCE);
        }
    }

    private void validateUserId(Long userId) {
        if (userId == null) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
    }

    private String normalizeCategory(String category) {
        return category == null || category.isBlank() ? null : category;
    }
}
