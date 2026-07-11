package com.cwww.post.dto;

import com.cwww.post.domain.PostComment;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class CommentResponse {

    private Long commentId;
    private Long postId;
    private Long userId;
    private Long parentCommentId;
    private String content;
    private LocalDateTime createdAt;

    public static CommentResponse from(PostComment comment) {
        return CommentResponse.builder()
                .commentId(comment.getCommentId())
                .postId(comment.getPostId())
                .userId(comment.getUserId())
                .parentCommentId(comment.getParentCommentId())
                .content(comment.getContent())
                .createdAt(comment.getCreatedAt())
                .build();
    }
}
