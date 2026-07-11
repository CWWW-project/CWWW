package com.cwww.post.controller;

import com.cwww.global.response.ApiResponse;
import com.cwww.post.dto.FeedResponse;
import com.cwww.post.dto.PostCreateRequest;
import com.cwww.post.dto.PostResponse;
import com.cwww.post.dto.PostUpdateRequest;
import com.cwww.post.service.PostService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@Slf4j
@Validated
@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    // TODO: JWT 인증 구현 후 SecurityContext에서 userId 추출하도록 교체
    @PostMapping
    public ResponseEntity<ApiResponse<PostResponse>> createPost(
            @RequestHeader("X-User-Id") Long userId,
            @Valid @RequestBody PostCreateRequest request) {
        PostResponse response = postService.createPost(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response));
    }

    @GetMapping("/{postId}")
    public ResponseEntity<ApiResponse<PostResponse>> getPost(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long postId) {
        PostResponse response = postService.getPost(userId, postId);
        try {
            postService.incrementViewCount(postId);
        } catch (Exception e) {
            log.warn("조회수 증가 실패: postId={}", postId, e);
        }
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/{postId}")
    public ResponseEntity<ApiResponse<Void>> updatePost(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long postId,
            @Valid @RequestBody PostUpdateRequest request) {
        postService.updatePost(userId, postId, request);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<ApiResponse<Void>> deletePost(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long postId) {
        postService.deletePost(userId, postId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/feed")
    public ResponseEntity<ApiResponse<FeedResponse>> getFeed(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam(required = false) Long cursor,
            @RequestParam(defaultValue = "10") @Min(1) @Max(50) int size) {
        FeedResponse response = postService.getFeed(userId, cursor, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{postId}/like")
    public ResponseEntity<ApiResponse<Void>> likePost(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long postId) {
        postService.likePost(userId, postId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @DeleteMapping("/{postId}/like")
    public ResponseEntity<ApiResponse<Void>> unlikePost(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long postId) {
        postService.unlikePost(userId, postId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<FeedResponse>> searchByHashtag(
            @RequestParam @NotBlank String tag,
            @RequestParam(required = false) Long cursor,
            @RequestParam(defaultValue = "10") @Min(1) @Max(50) int size) {
        FeedResponse response = postService.searchByHashtag(tag, cursor, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
