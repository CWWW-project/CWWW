package com.cwww.minihompy.controller;

import com.cwww.global.response.ApiResponse;
import com.cwww.minihompy.dto.request.MinihompySettingsRequest;
import com.cwww.minihompy.dto.request.ProfileImageUploadRequest;
import com.cwww.minihompy.dto.response.MinihompyMainResponse;
import com.cwww.minihompy.dto.response.ProfileImageResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.cwww.minihompy.service.MinihompyService;

import lombok.RequiredArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/minihompy")
@RequiredArgsConstructor
public class MinihompyController {
	
	private final MinihompyService minihompyService;

	@GetMapping("/{ownerId}")
	public ApiResponse<MinihompyMainResponse> getMinihompyMain(
			@PathVariable Long ownerId
	) {

		// TODO 지금은 임시로 로그인 사용자를 하드코딩, 인증 완료되면 교체 예정
		Long viewerId = 1L;

		MinihompyMainResponse response = minihompyService.getMinihompyMain(ownerId,viewerId);

		return ApiResponse.success(response);
	}

	// 프로필 사진 업로드/변경 (있으면 교체, 없으면 생성)
	@PutMapping("/profile-image")
	public ApiResponse<ProfileImageResponse> uploadProfileImage(
			@RequestParam("file")MultipartFile file
	) {

		// TODO 지금은 임시로 로그인 사용자를 하드코딩, 인증 완료되면 교체 예정
		Long userId = 1L;
		ProfileImageResponse response = minihompyService.uploadProfileImage(userId, file);

		return ApiResponse.success(response);

	}

	// 프로필 사진 삭제
	@DeleteMapping("/profile-image")
	public ApiResponse<Void> deleteProfileImage() {

		// TODO 지금은 임시로 로그인 사용자를 하드코딩, 인증 완료되면 교체 예정
		Long userId = 1L;
		minihompyService.deleteProfileImage(userId);

		return ApiResponse.success(null);
	}


	// 미니홈피 설정 변경(공개범위, 소개글, 기분 한번에)
	@PatchMapping("/settings")
	public ApiResponse<MinihompyMainResponse> updateSettings(
			@RequestBody MinihompySettingsRequest request
	) {

		// TODO 지금은 임시로 로그인 사용자를 하드코딩, 인증 완료되면 교체 예정
		Long userId = 1L;
		MinihompyMainResponse response = minihompyService.updateSettings(userId, request);

		return ApiResponse.success(response);

	}

}
