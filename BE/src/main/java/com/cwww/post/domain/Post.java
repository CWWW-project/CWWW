package com.cwww.post.domain;

import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class Post {

    private Long postId;
    private Long userId;
    private Long minihompyId;
    private String title;
    private String content;
    private String visibility;
    private int viewCount;
    private int likeCount;
    private int commentCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;
}
