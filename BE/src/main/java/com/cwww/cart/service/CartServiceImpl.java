package com.cwww.cart.service;

import com.cwww.cart.domain.CartItem;
import com.cwww.cart.dto.CartItemResponse;
import com.cwww.cart.dto.CartPurchaseResponse;
import com.cwww.cart.mapper.CartMapper;
import com.cwww.global.exception.BusinessException;
import com.cwww.global.exception.ErrorCode;
import com.cwww.item.domain.Item;
import com.cwww.item.domain.ItemPurchase;
import com.cwww.item.domain.UserInventory;
import com.cwww.item.dto.PurchaseResponse;
import com.cwww.item.mapper.ItemMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {

    private static final String PURCHASE_COMPLETED = "COMPLETED";

    private final CartMapper cartMapper;
    private final ItemMapper itemMapper;

    @Override
    @Transactional(readOnly = true)
    public List<CartItemResponse> getCart(Long userId) {
        validateUserId(userId);
        return cartMapper.selectCartItems(userId);
    }

    @Override
    @Transactional
    public List<CartItemResponse> addCartItem(Long userId, Long itemId) {
        validateUserId(userId);
        Item item = getActiveItem(itemId);
        validatePurchasable(userId, item);
        if (cartMapper.existsCartItem(userId, itemId) > 0) {
            throw new BusinessException(ErrorCode.DUPLICATE_RESOURCE);
        }

        CartItem cartItem = new CartItem();
        cartItem.setUserId(userId);
        cartItem.setItemId(itemId);
        try {
            cartMapper.insertCartItem(cartItem);
        } catch (DuplicateKeyException e) {
            throw new BusinessException(ErrorCode.DUPLICATE_RESOURCE);
        }
        return cartMapper.selectCartItems(userId);
    }

    @Override
    @Transactional
    public void deleteCartItem(Long userId, Long cartId) {
        validateUserId(userId);
        if (cartId == null || cartMapper.deleteCartItem(userId, cartId) == 0) {
            throw new BusinessException(ErrorCode.CART_ITEM_NOT_FOUND);
        }
    }

    @Override
    @Transactional
    public void clearCart(Long userId) {
        validateUserId(userId);
        cartMapper.deleteCartItems(userId);
    }

    @Override
    @Transactional
    public CartPurchaseResponse purchaseCart(Long userId) {
        validateUserId(userId);
        List<CartItemResponse> cartItems = cartMapper.selectCartItems(userId);
        if (cartItems.isEmpty()) {
            throw new BusinessException(ErrorCode.EMPTY_CART);
        }

        int totalPrice = 0;
        List<Item> items = new ArrayList<>();
        Set<Long> itemIds = new HashSet<>();
        for (CartItemResponse cartItem : cartItems) {
            if (!itemIds.add(cartItem.getItemId())) {
                throw new BusinessException(ErrorCode.DUPLICATE_RESOURCE);
            }
            Item item = getActiveItem(cartItem.getItemId());
            validatePurchasable(userId, item);
            totalPrice += item.getPrice();
            items.add(item);
        }

        int updatedRows = itemMapper.decreaseAcornBalance(userId, totalPrice);
        if (updatedRows == 0) {
            throw new BusinessException(ErrorCode.INSUFFICIENT_ACORNS);
        }

        List<PurchaseResponse> purchases = new ArrayList<>();
        for (Item item : items) {
            purchases.add(grantItem(userId, item));
        }
        cartMapper.deleteCartItems(userId);

        return CartPurchaseResponse.builder()
                .totalPrice(totalPrice)
                .remainingAcorns(itemMapper.selectAcornBalance(userId))
                .purchasedItems(purchases)
                .build();
    }

    private Item getActiveItem(Long itemId) {
        if (itemId == null) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
        Item item = itemMapper.findById(itemId);
        if (item == null) {
            throw new BusinessException(ErrorCode.ITEM_NOT_FOUND);
        }
        return item;
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

    private PurchaseResponse grantItem(Long userId, Item item) {
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
                .build();
    }

    private void validateUserId(Long userId) {
        if (userId == null) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
    }
}
