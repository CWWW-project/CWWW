package com.cwww.item.service;

import com.cwww.global.exception.BusinessException;
import com.cwww.global.exception.ErrorCode;
import com.cwww.item.domain.Item;
import com.cwww.item.dto.ItemPurchaseRequest;
import com.cwww.item.dto.ItemPurchaseResponse;
import com.cwww.item.mapper.ItemMapper;
import com.cwww.payment.domain.AcornWallet;
import com.cwww.payment.mapper.PaymentMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ItemServiceImpl implements ItemService {

    private final ItemMapper itemMapper;
    private final PaymentMapper paymentMapper;

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

    /**
     * 아이템 구매
     *
     * 1) 아이템 존재 및 판매 상태 확인
     * 2) 이미 보유한 아이템 중복 확인
     * 3) 지갑 잠금 + 잔액 확인
     * 4) 잔액 차감 + USE 원장 기록
     * 5) 인벤토리 삽입
     */
    @Override
    @Transactional
    public ItemPurchaseResponse purchaseItems(Long userId, ItemPurchaseRequest request) {
        List<Long> itemIds = request.getItemIds();

        // 아이템 조회 및 존재 확인
        List<Item> items = itemMapper.findByIds(itemIds);
        if (items.size() != itemIds.size()) {
            throw new BusinessException(ErrorCode.ITEM_NOT_FOUND);
        }

        // 판매 상태 확인
        for (Item item : items) {
            if (!"ON_SALE".equals(item.getStatus())) {
                throw new BusinessException(ErrorCode.ITEM_NOT_FOUND);
            }
        }

        // 이미 보유한 아이템 확인
        List<Long> ownedIds = itemMapper.findOwnedItemIds(userId, itemIds);
        if (!ownedIds.isEmpty()) {
            throw new BusinessException(ErrorCode.ITEM_ALREADY_OWNED);
        }

        // 총 가격 계산
        int totalPrice = items.stream().mapToInt(Item::getPrice).sum();

        // 지갑 잠금 및 잔액 확인
        paymentMapper.upsertWallet(userId);
        AcornWallet wallet = paymentMapper.findWalletForUpdate(userId);
        if (wallet.getAvailableBalance() < totalPrice) {
            throw new BusinessException(ErrorCode.INSUFFICIENT_ACORN_BALANCE);
        }

        int balanceAfter = wallet.getBalance() - totalPrice;

        // 잔액 차감 + USE 원장 기록
        paymentMapper.addWalletBalance(userId, -totalPrice);
        paymentMapper.insertAcornTransactionUse(userId, -totalPrice, balanceAfter);

        // 인벤토리 삽입
        for (Item item : items) {
            itemMapper.insertUserInventory(userId, item.getItemId());
        }

        log.info("아이템 구매 완료: userId={}, itemIds={}, totalPrice={}", userId, itemIds, totalPrice);

        AcornWallet updated = paymentMapper.findWalletByUserId(userId);
        return ItemPurchaseResponse.builder()
                .purchasedItems(items)
                .balance(updated.getBalance())
                .availableBalance(updated.getAvailableBalance())
                .build();
    }

    @Override
    public List<Item> findUserInventory(Long userId) {
        return itemMapper.findUserInventory(userId);
    }
}