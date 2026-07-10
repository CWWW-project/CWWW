package com.cwww.post.domain;

import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class PostLike {

    private Long postId;
    private Long userId;
    private LocalDateTime createdAt;
}
