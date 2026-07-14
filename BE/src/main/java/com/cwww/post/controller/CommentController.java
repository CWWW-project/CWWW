package com.cwww.post.controller;

import com.cwww.global.response.ApiResponse;
import com.cwww.post.dto.CommentCreateRequest;
import com.cwww.post.dto.CommentResponse;
import com.cwww.post.service.CommentService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Validated
@RestController
@RequestMapping("/api/posts/{postId}/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @PostMapping
    public ResponseEntity<ApiResponse<Void>> createComment(
            @AuthenticationPrincipal Long userId,
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
            @AuthenticationPrincipal Long userId,
            @PathVariable Long postId,
            @PathVariable Long commentId,
            @RequestBody @NotBlank @Size(max = 500) String content) {
        commentService.updateComment(userId, postId, commentId, content);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<ApiResponse<Void>> deleteComment(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long postId,
            @PathVariable Long commentId) {
        commentService.deleteComment(userId, postId, commentId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
