package com.cwww.minihompy.domain;


import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Media {

    private Long mediaId;
    private TargetType targetType;
    private Long targetId;
    private String mediaUrl;
    private LocalDateTime createdAt;

    public enum TargetType {
        PROFILE
    }

}


