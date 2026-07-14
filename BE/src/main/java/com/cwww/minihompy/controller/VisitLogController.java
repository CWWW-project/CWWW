package com.cwww.minihompy.controller;

import com.cwww.global.response.ApiResponse;
import com.cwww.minihompy.dto.response.VisitorLogResponse;
import com.cwww.minihompy.service.VisitLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/minihompy")
@RequiredArgsConstructor
public class VisitLogController {

    private final VisitLogService visitLogService;

    // 방문자 기록 조회 (홈피 주인 본인만) - 별도 방문자 목록 페이지용
    @GetMapping("/visitors")
    public ApiResponse<List<VisitorLogResponse>> getRecentVisitors() {

        // TODO 지금은 임시로 로그인 사용자를 하드코딩, 인증 완료되면 교체 예정
        Long userId = 1L;
        List<VisitorLogResponse> response = visitLogService.getRecentVisitors(userId);

        return ApiResponse.success(response);

    }

}
