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

    // media.target_type 값 - 미니홈피 도메인에서 쓰는 값만
    public enum TargetType {
        PROFILE,
        BACKGROUND,
        BGM // BGM 아이템의 실제 오디오 파일 (target_id = item_id)
    }

}
