package com.cwww.minihompy.controller;

import com.cwww.global.response.ApiResponse;
import com.cwww.minihompy.dto.request.BackgroundDotApplyRequest;
import com.cwww.minihompy.dto.response.BackgroundDotOptionResponse;
import com.cwww.minihompy.dto.response.BackgroundResponse;
import com.cwww.minihompy.service.BackgroundService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/minihompy/background")
@RequiredArgsConstructor
public class BackgroundController {

    private final BackgroundService backgroundService;


    // 도트 배경 선택지 목록 조회
    @GetMapping("/dot-options")
    public ApiResponse<List<BackgroundDotOptionResponse>> getBackgroundDotOptions() {

        List<BackgroundDotOptionResponse> response = backgroundService.getBackgroundDotOptions();
        return ApiResponse.success(response);

    }


    // 도트 배경 적용
    @PutMapping("/dot")
    public ApiResponse<BackgroundResponse> applyDotBackground(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody BackgroundDotApplyRequest request
    ) {

        BackgroundResponse response = backgroundService.applyDotBackground(userId, request.getCode());
        return ApiResponse.success(response);

    }


    // 사진 배경 업로드
    @PutMapping(value = "/photo", consumes = "multipart/form-data")
    public ApiResponse<BackgroundResponse> uploadPhotoBackground(
            @AuthenticationPrincipal Long userId,
            @RequestParam("file") MultipartFile file
    ) {

        BackgroundResponse response = backgroundService.uploadPhotoBackground(userId, file);
        return ApiResponse.success(response);

    }

}
