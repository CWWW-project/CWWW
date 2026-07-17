package com.cwww.item.controller;

import com.cwww.global.exception.BusinessException;
import com.cwww.global.exception.ErrorCode;
import com.cwww.global.response.ApiResponse;
import com.cwww.item.domain.Item;
import com.cwww.item.dto.ItemPurchaseRequest;
import com.cwww.item.dto.ItemPurchaseResponse;
import com.cwww.item.service.ItemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("/api/items")
@RequiredArgsConstructor
public class ItemController {

    private static final int MAX_PAGE_SIZE = 100;

    private final ItemService itemService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Item>>> getItems(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        if (page < 1 || size < 1 || size > MAX_PAGE_SIZE) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
        return ResponseEntity.ok(ApiResponse.success(itemService.find(page, size)));
    }

    @GetMapping("/{itemId}")
    public ResponseEntity<ApiResponse<Item>> getItem(@PathVariable Long itemId) {
        return ResponseEntity.ok(ApiResponse.success(itemService.findById(itemId)));
    }

    @PostMapping("/purchase")
    public ResponseEntity<ApiResponse<ItemPurchaseResponse>> purchaseItems(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody ItemPurchaseRequest request) {
        return ResponseEntity.ok(ApiResponse.success(itemService.purchaseItems(userId, request)));
    }

    @GetMapping("/inventory")
    public ResponseEntity<ApiResponse<List<Item>>> getUserInventory(
            @AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(ApiResponse.success(itemService.findUserInventory(userId)));
    }
}