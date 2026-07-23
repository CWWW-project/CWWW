package com.cwww.minihompy.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

// 방문자 기록 조회 응답 (최근 방문자 목록용)
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VisitorLogResponse {

    private String nickname;
    private String profileImageUrl;
    private Long visitorId;
    private LocalDateTime visitedAt;

}
