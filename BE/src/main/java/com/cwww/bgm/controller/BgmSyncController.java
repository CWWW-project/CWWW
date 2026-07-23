package com.cwww.bgm.controller;

import com.cwww.bgm.service.BgmSyncService;
import com.cwww.global.response.ApiResponse;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/*
 * BGM 카탈로그 초기 구축용 관리자 API
 */
@RestController
@RequestMapping("/api/admin/bgm")
@RequiredArgsConstructor
@Validated
public class BgmSyncController {

    private final BgmSyncService bgmSyncService;

    // Jamendo에서 트랙을 가져와 item+media에 등록
    @PostMapping("/sync")
    public ApiResponse<Integer> syncBgm(
            @RequestParam(defaultValue = "10") @Min(1) @Max(200) int limit
    ) {

        int registered = bgmSyncService.syncFromJamendo(limit);
        return ApiResponse.success(registered);

    }

}
