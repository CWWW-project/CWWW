package com.cwww.cart.service;

import com.cwww.cart.dto.CartItemResponse;
import com.cwww.cart.dto.CartPurchaseResponse;

import java.util.List;

public interface CartService {

    List<CartItemResponse> getCart(Long userId);

    List<CartItemResponse> addCartItem(Long userId, Long itemId);

    void deleteCartItem(Long userId, Long cartId);

    void clearCart(Long userId);

    CartPurchaseResponse purchaseCart(Long userId);
}
