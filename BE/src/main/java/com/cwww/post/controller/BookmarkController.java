package com.cwww.post.controller;

import com.cwww.global.response.ApiResponse;
import com.cwww.post.dto.FeedResponse;
import com.cwww.post.service.BookmarkService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@Validated
@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class BookmarkController {

    private final BookmarkService bookmarkService;

    @PostMapping("/{postId}/bookmark")
    public ResponseEntity<Void> bookmark(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long postId) {
        bookmarkService.bookmark(userId, postId);
        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED).build();
    }

    @DeleteMapping("/{postId}/bookmark")
    public ResponseEntity<Void> unbookmark(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long postId) {
        bookmarkService.unbookmark(userId, postId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/bookmarks")
    public ResponseEntity<ApiResponse<FeedResponse>> getBookmarks(
            @AuthenticationPrincipal Long userId,
            @RequestParam(required = false) Long cursor,
            @RequestParam(defaultValue = "10") @Min(1) @Max(50) int size) {
        FeedResponse response = bookmarkService.getBookmarks(userId, cursor, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
