package com.cwww.minihompy.dto.response;

import java.time.LocalDateTime;

import com.cwww.minihompy.domain.Minihompy;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/*
 * 미니홈피 메인 조회 및 프로필 표시 응답
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class MinihompyMainResponse {
	
	private Long ownerId;
	private String nickname;
	private String profileImageUrl;
	private String title; // 대문 제목
	private String introduction; // 소개글
	private String mood; // 오늘의 기분
	private Minihompy.AccessLevel accessLevel; // 공개 범위 (ALL/FRIEND/PRIVATE)
	private LocalDateTime createdAt;
	private String bgmUrl;
	private String backgroundColor;      // 도트 배경 색상 hex (사진 쓰면 null)
	private String backgroundImageUrl;   // 업로드한 배경 사진 URL (색상 쓰면 null)

	private VisitorCount visitorCount; // 방문자 수 (Today/Total)

	private boolean owner; // 현재 로그인 사용자가 owner 본인인지 (getter: isOwner())


	@Getter
	@Builder
	@NoArgsConstructor
	@AllArgsConstructor
	public static class VisitorCount {

		private long today;
		private long total;

	}

}
