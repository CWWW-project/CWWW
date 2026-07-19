package com.cwww.cart.controller;

import com.cwww.cart.dto.CartAddRequest;
import com.cwww.cart.dto.CartItemResponse;
import com.cwww.cart.dto.CartPurchaseResponse;
import com.cwww.cart.service.CartService;
import com.cwww.global.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/carts")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CartItemResponse>>> getCart(
            @AuthenticationPrincipal Long userId
    ) {
        return ResponseEntity.ok(ApiResponse.success(cartService.getCart(userId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<List<CartItemResponse>>> addCartItem(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody CartAddRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(cartService.addCartItem(userId, request.getItemId())));
    }

    @DeleteMapping("/{cartItemId}")
    public ResponseEntity<ApiResponse<Void>> deleteCartItem(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long cartItemId
    ) {
        cartService.deleteCartItem(userId, cartItemId);
        return ResponseEntity.ok(ApiResponse.success());
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> clearCart(
            @AuthenticationPrincipal Long userId
    ) {
        cartService.clearCart(userId);
        return ResponseEntity.ok(ApiResponse.success());
    }

    @PostMapping("/purchase")
    public ResponseEntity<ApiResponse<CartPurchaseResponse>> purchaseCart(
            @AuthenticationPrincipal Long userId
    ) {
        return ResponseEntity.ok(ApiResponse.success(cartService.purchaseCart(userId)));
    }
}
