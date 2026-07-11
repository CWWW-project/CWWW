package com.cwww.minihompy.domain.response;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/*
 * 미니홈피 메인 조회 응답
 *  
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MinihompyMainResponse {
	
	private Long ownerId;
	private String nickname;
	private String profileImageUrl;
	private String title; // 대문 제목
	private String introduction; // 소개글
	private String mood; // 오늘의 기분
	private AccessLevel accessLevel; // 공개 범위 (ALL/FRIEND/PRIVATE)
	private LocalDateTime createdAt;
	private String bgmUrl;
	
	
	// 공개 범위 (ALL/FRIEND/PRIVATE)
	public enum AccessLevel { 
		ALL,
	    FRIEND,
	    PRIVATE
	}

}
