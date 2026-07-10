package com.cwww.post.domain;

import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class Media {

    private Long mediaId;
    private String targetType;  // 'POST'
    private Long targetId;
    private String mediaUrl;
    private LocalDateTime createdAt;
}
