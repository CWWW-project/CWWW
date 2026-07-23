package com.cwww.minihompy.domain;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Minihompy {

    private Long minihompyId;
    private Long userId;
    private String title;
    private String introduction;
    private String mood;
    private Long mediaId;
    private AccessLevel accessLevel;
    private LocalDateTime createdAt;
    private String backgroundColor; // 도트 배경 색상 hex (사진 URL은 media 테이블 별도 관리)
    private LocalDateTime deletedAt; // 소프트 삭제 - null이면 살아있는 미니홈피

    // 공개 범위 (ALL/FRIEND/PRIVATE)
    public enum AccessLevel {
        ALL,
        FRIEND,
        PRIVATE
    }

}
