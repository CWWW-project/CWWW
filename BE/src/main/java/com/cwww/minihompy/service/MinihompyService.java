package com.cwww.minihompy.service;

import com.cwww.global.storage.StorageService;
import com.cwww.minihompy.domain.Media;
import com.cwww.minihompy.domain.Minihompy;
import com.cwww.minihompy.dto.response.ProfileImageResponse;
import com.cwww.minihompy.mapper.ProfileMediaMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cwww.global.exception.BusinessException;
import com.cwww.global.exception.ErrorCode;
import com.cwww.minihompy.dto.response.MinihompyMainResponse;
import com.cwww.minihompy.mapper.MinihompyMapper;

import lombok.RequiredArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class MinihompyService {
	
	private final MinihompyMapper minihompyMapper;
	private final ProfileMediaMapper profileMediaMapper;
	private final StorageService storageService;

	private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
	private static final List<String> ALLOWED_EXTENSIONS = List.of("jpg", "jpeg", "png");


	// 미니홈피 메인 조회( + 최초 접근 시 자동 생성)
	@Transactional
	public MinihompyMainResponse getMinihompyMain(Long ownerId, Long viewerId) {
		
		MinihompyMainResponse response = minihompyMapper.selectMinihompyMain(ownerId);
		
		if(response == null) {

			// 본인이 처음 접근한 경우에만 기본 생성 (남의 미니홈피가 없다고 만들어주면 안 됨)
			if(viewerId != null && viewerId.equals(ownerId)) {

				Minihompy defaultMinihompy = Minihompy.builder()
						.userId(ownerId)
						.title("환영합니다")
						.introduction("")
						.accessLevel(Minihompy.AccessLevel.ALL)
						.createdAt(LocalDateTime.now())
						.build();
				
				minihompyMapper.insertDefaultMinihompy(defaultMinihompy);
				response = minihompyMapper.selectMinihompyMain(ownerId);
				
			}else {
				throw new BusinessException(ErrorCode.MINIHOMPY_NOT_FOUND);
			}
			
		}
		
		// 권한 체크는 response가 null이든 아니든(=새로 만들어졌든 원래 있었든) 항상 실행돼야 함
		boolean isOwner = viewerId != null && viewerId.equals(ownerId);

		// PRIVATE은 본인 외에 접근 못함
		if(!isOwner && response.getAccessLevel() == Minihompy.AccessLevel.PRIVATE) {
			throw new BusinessException(ErrorCode.MINIHOMPY_FORBIDDEN);
		}
		
		// TODO 일촌 체크 로직 필요

		// 계산된 owner 여부를 응답에 채워서 리턴 (프론트가 편집 UI 노출 여부 판단에 사용)
		return response.toBuilder()
				.owner(isOwner)
				.build();
	}


	// 프로필 사진 업로드/변경 (공용 StorageService 사용)
	public ProfileImageResponse uploadProfileImage(Long userId, MultipartFile file) {

		// 파일 검증
		validateImageFile(file);

		// 새 파일 먼저 저장(기존 것 아직 안 거드림, 실패해도 기존 사진 안전)
		String imageUrl = storageService.store(file);

		// 해당 유저가 이미 프로필 사진이 있는지 확인
		Media existing = profileMediaMapper.selectMedia(Media.TargetType.PROFILE, userId);

		int affected;

		if(existing != null) {

			// 있으면 mediaId 기준으로 갱신(mediaUrl만 새 걸로 바꿔치기)
			existing.setMediaUrl(imageUrl);
			affected = profileMediaMapper.updateMedia(existing);

		}else {

			// 없으면 신규 insert
			Media media = Media.builder()
					.targetId(userId)
					.targetType(Media.TargetType.PROFILE)
					.mediaUrl(imageUrl)
					.createdAt(LocalDateTime.now())
					.build();

			affected = profileMediaMapper.insertMedia(media);

		}

		if(affected != 1) {
			throw new BusinessException(ErrorCode.FILE_UPLOAD_FAILED);
		}

		return ProfileImageResponse.builder()
				.profileImageUrl(imageUrl)
				.build();

	}


	// 파일 검증
	private void validateImageFile(MultipartFile file) {

		// 파일이 없는 경우
		if(file.isEmpty()) {
			throw new BusinessException(ErrorCode.INVALID_INPUT);
		}

		// 파일 크기 초과 확인
		if(file.getSize() > MAX_FILE_SIZE) {
			throw new BusinessException(ErrorCode.FILE_SIZE_EXCEEDED);
		}

		String originalFilename = file.getOriginalFilename();

		// 파일명이 이상하거나(없거나) 확장자가 없는 경우
		if(originalFilename == null || !originalFilename.contains(".")) {
			throw new BusinessException(ErrorCode.INVALID_FILE_EXTENSION);
		}

		// EXTENSIONS 추출 및 소문자로 통일
		String ext = originalFilename
				.substring(originalFilename.lastIndexOf('.') + 1)
				.toLowerCase(Locale.ROOT);

		if(!ALLOWED_EXTENSIONS.contains(ext)) {
			throw new BusinessException(ErrorCode.INVALID_FILE_EXTENSION);
		}

	}

}
