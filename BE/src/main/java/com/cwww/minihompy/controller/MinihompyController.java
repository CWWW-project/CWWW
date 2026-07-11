package com.cwww.minihompy.controller;

import com.cwww.global.response.ApiResponse;
import com.cwww.minihompy.domain.response.MinihompyMainResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cwww.minihompy.service.MinihompyService;

import lombok.RequiredArgsConstructor;

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

}
