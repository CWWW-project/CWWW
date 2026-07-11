package com.cwww.post.controller;

import com.cwww.global.response.ApiResponse;
import com.cwww.post.dto.FeedResponse;
import com.cwww.post.service.BookmarkService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@Validated
@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class BookmarkController {

    private final BookmarkService bookmarkService;

    @PostMapping("/{postId}/bookmark")
    public ResponseEntity<ApiResponse<Void>> bookmark(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long postId) {
        bookmarkService.bookmark(userId, postId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @DeleteMapping("/{postId}/bookmark")
    public ResponseEntity<ApiResponse<Void>> unbookmark(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long postId) {
        bookmarkService.unbookmark(userId, postId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/bookmarks")
    public ResponseEntity<ApiResponse<FeedResponse>> getBookmarks(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam(required = false) Long cursor,
            @RequestParam(defaultValue = "10") @Min(1) @Max(50) int size) {
        FeedResponse response = bookmarkService.getBookmarks(userId, cursor, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
