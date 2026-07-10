package com.cwww.post.controller;

import com.cwww.global.response.ApiResponse;
import com.cwww.post.dto.PostCreateRequest;
import com.cwww.post.dto.PostResponse;
import com.cwww.post.service.PostService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
