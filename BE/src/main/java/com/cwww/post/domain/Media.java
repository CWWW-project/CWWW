package com.cwww.post.domain;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Media {

    private Long mediaId;
    private String targetType;
    private Long targetId;
    private String mediaUrl;
    private LocalDateTime createdAt;
}
