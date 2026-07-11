package com.cwww.post.controller;

import com.cwww.global.response.ApiResponse;
import com.cwww.post.dto.CommentCreateRequest;
import com.cwww.post.dto.CommentResponse;
import com.cwww.post.dto.CommentUpdateRequest;
import com.cwww.post.service.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/posts/{postId}/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @PostMapping
    public ResponseEntity<ApiResponse<Void>> createComment(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long postId,
            @Valid @RequestBody CommentCreateRequest request) {
        commentService.createComment(userId, postId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(null));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CommentResponse>>> getComments(
            @PathVariable Long postId) {
        List<CommentResponse> responses = commentService.getComments(postId);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @PatchMapping("/{commentId}")
    public ResponseEntity<ApiResponse<Void>> updateComment(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long postId,
            @PathVariable Long commentId,
            @Valid @RequestBody CommentUpdateRequest request) {
        commentService.updateComment(userId, postId, commentId, request.getContent());
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<ApiResponse<Void>> deleteComment(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long postId,
            @PathVariable Long commentId) {
        commentService.deleteComment(userId, postId, commentId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
