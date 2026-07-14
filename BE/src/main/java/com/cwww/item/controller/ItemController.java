package com.cwww.item.controller;

import com.cwww.global.response.ApiResponse;
import com.cwww.item.dto.InventoryItemResponse;
import com.cwww.item.dto.ItemResponse;
import com.cwww.item.dto.PurchaseResponse;
import com.cwww.item.service.ItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ItemController {

    private final ItemService itemService;

    @GetMapping("/items")
    public ApiResponse<List<ItemResponse>> getItems(@RequestParam(required = false) String category) {
        return ApiResponse.success(itemService.getItems(category));
    }

    @GetMapping("/inventory/me")
    public ApiResponse<List<InventoryItemResponse>> getMyInventory(
            @RequestHeader("X-User-Id") Long userId
    ) {
        return ApiResponse.success(itemService.getInventory(userId));
    }

    @PostMapping("/items/{itemId}/purchase")
    public ApiResponse<PurchaseResponse> purchaseItem(
            @PathVariable Long itemId,
            @RequestHeader("X-User-Id") Long userId
    ) {
        return ApiResponse.success(itemService.purchaseItem(userId, itemId));
    }
}
