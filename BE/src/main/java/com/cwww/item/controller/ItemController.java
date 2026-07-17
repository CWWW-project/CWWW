package com.cwww.item.controller;

import com.cwww.global.exception.BusinessException;
import com.cwww.global.exception.ErrorCode;
import com.cwww.global.response.ApiResponse;
import com.cwww.item.domain.Item;
import com.cwww.item.service.ItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
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
    }}