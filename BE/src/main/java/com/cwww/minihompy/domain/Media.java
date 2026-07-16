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
        PROFILE,
        BGM // BGM 아이템의 실제 오디오 파일 (target_id = item_id)
    }

}
