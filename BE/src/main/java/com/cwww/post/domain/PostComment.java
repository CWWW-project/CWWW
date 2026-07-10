package com.cwww.post.domain;

import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class PostComment {

    private Long commentId;
    private Long postId;
    private Long userId;
    private Long parentCommentId;
    private String content;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
