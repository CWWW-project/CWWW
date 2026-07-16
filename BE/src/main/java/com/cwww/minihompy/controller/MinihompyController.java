package com.cwww.minihompy.controller;

import com.cwww.global.response.ApiResponse;
import com.cwww.minihompy.dto.request.BgmApplyRequest;
import com.cwww.minihompy.dto.request.MinihompySettingsRequest;
import com.cwww.minihompy.dto.response.BgmApplyResponse;
import com.cwww.minihompy.dto.response.BgmOptionResponse;
import com.cwww.minihompy.dto.response.MinihompyMainResponse;
import com.cwww.minihompy.dto.response.ProfileImageResponse;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.cwww.minihompy.service.MinihompyService;

import lombok.RequiredArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/minihompy")
@RequiredArgsConstructor
public class MinihompyController {
	
	private final MinihompyService minihompyService;

	// 미니홈피 조회(다른 유저 것도 조회 가능)
	@GetMapping("/{ownerId}")
	public ApiResponse<MinihompyMainResponse> getMinihompyMain(
			@PathVariable Long ownerId,
			@AuthenticationPrincipal Long viewerId
	) {

		MinihompyMainResponse response = minihompyService.getMinihompyMain(ownerId,viewerId);
		return ApiResponse.success(response);

	}

	// 내 미니홈피 조회
	@GetMapping("/me")
	public ApiResponse<MinihompyMainResponse> getMyMinihompy(
			@AuthenticationPrincipal Long userId
	) {

		MinihompyMainResponse response = minihompyService.getMinihompyMain(userId, userId);
		return ApiResponse.success(response);

	}

	// 프로필 사진 업로드/변경 (있으면 교체, 없으면 생성)
	@PutMapping("/profile-image")
	public ApiResponse<ProfileImageResponse> uploadProfileImage(
			@AuthenticationPrincipal Long userId,
			@RequestParam("file")MultipartFile file
	) {

		ProfileImageResponse response = minihompyService.uploadProfileImage(userId, file);
		return ApiResponse.success(response);

	}

	// 프로필 사진 삭제
	@DeleteMapping("/profile-image")
	public ApiResponse<Void> deleteProfileImage(
			@AuthenticationPrincipal Long userId
	) {

		minihompyService.deleteProfileImage(userId);
		return ApiResponse.success(null);

	}


	// 미니홈피 설정 변경(공개범위, 소개글, 기분 한번에)
	@PatchMapping("/settings")
	public ApiResponse<MinihompyMainResponse> updateSettings(
			@AuthenticationPrincipal Long userId,
			@Valid @RequestBody MinihompySettingsRequest request
	) {

		MinihompyMainResponse response = minihompyService.updateSettings(userId, request);
		return ApiResponse.success(response);

	}


	// 내가 구매한 BGM 조회
	@GetMapping("/bgm-options")
	public ApiResponse<List<BgmOptionResponse>> getBgmOptions(
			@AuthenticationPrincipal Long userId
	) {

		List<BgmOptionResponse> response = minihompyService.getBgmOptions(userId);
		return ApiResponse.success(response);

	}


	// BGM 적용/끄지
	@PutMapping("/bgm")
	public ApiResponse<BgmApplyResponse> applyBgm(
			@AuthenticationPrincipal Long userId,
			@RequestBody BgmApplyRequest request
	) {

		BgmApplyResponse response = minihompyService.applyBgm(userId, request.getItemId());
		return ApiResponse.success(response);

	}

}
