package com.cwww.bgm.controller;

import com.cwww.bgm.service.BgmSyncService;
import com.cwww.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/*
 * BGM 카탈로그 초기 구축용 관리자 API
 * TODO: 인증 붙으면 관리자 권한 체크 추가 필요 (@AuthenticationPrincipal 등으로 role 확인)
 */
@RestController
@RequestMapping("/api/admin/bgm")
@RequiredArgsConstructor
public class BgmSyncController {

    private final BgmSyncService bgmSyncService;

    // Jamendo에서 트랙을 가져와 item+media에 등록
    @PostMapping("/sync")
    public ApiResponse<Integer> syncBgm(
            @RequestParam(defaultValue = "10") int limit
    ) {

        int registered = bgmSyncService.syncFromJamendo(limit);
        return ApiResponse.success(registered);

    }

}
