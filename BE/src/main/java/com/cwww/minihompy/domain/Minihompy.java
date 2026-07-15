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


    // 공개 범위 (ALL/FRIEND/PRIVATE)
    public enum AccessLevel {
        ALL,
        FRIEND,
        PRIVATE
    }

}
