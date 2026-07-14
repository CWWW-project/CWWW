package com.cwww.minihompy.service;

import com.cwww.friend.mapper.FriendMapper;
import com.cwww.global.storage.StorageService;
import com.cwww.minihompy.domain.Media;
import com.cwww.minihompy.domain.Minihompy;
import com.cwww.minihompy.domain.VisitLog;
import com.cwww.minihompy.dto.request.MinihompySettingsRequest;
import com.cwww.minihompy.dto.response.ProfileImageResponse;
import com.cwww.minihompy.mapper.ProfileMediaMapper;
import com.cwww.minihompy.mapper.VisitLogMapper;
import com.cwww.user.mapper.UserMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cwww.global.exception.BusinessException;
import com.cwww.global.exception.ErrorCode;
import com.cwww.minihompy.dto.response.MinihompyMainResponse;
import com.cwww.minihompy.mapper.MinihompyMapper;

import lombok.RequiredArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Slf4j
public class MinihompyService {
	
	private final MinihompyMapper minihompyMapper;
	private final ProfileMediaMapper profileMediaMapper;
	private final StorageService storageService;
	private final UserMapper userMapper;
	private final FriendMapper friendMapper;


	private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
	private static final List<String> ALLOWED_EXTENSIONS = List.of("jpg", "jpeg", "png");
	private final VisitLogMapper visitLogMapper;


	// 미니홈피 메인 조회( + 최초 접근 시 자동 생성)
	@Transactional
	public MinihompyMainResponse getMinihompyMain(Long ownerId, Long viewerId) {
		
		MinihompyMainResponse response = minihompyMapper.selectMinihompyMain(ownerId);
		
		if(response == null) {

			// 본인이 처음 접근한 경우에만 기본 생성 (남의 미니홈피가 없다고 만들어주면 안 됨)
			if(viewerId != null && viewerId.equals(ownerId)) {

				String nickname = userMapper.findNicknameById(ownerId);

				Minihompy defaultMinihompy = Minihompy.builder()
						.userId(ownerId)
						.title(nickname + "의 홈피")
						.introduction("")
						.mood(null)
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

		// 미니홈피 주인이 아닐 경우 접근 권한 체크(PRIVATE, FRIEND, ALL)
		if(!isOwner) {

			checkAccessPermission(response.getAccessLevel(), ownerId, viewerId);

			if(viewerId != null) {

				try {

					Long minihompyId = visitLogMapper.selectMinihompyIdByOwnerId(ownerId);

					VisitLog visitLog = VisitLog.builder()
							.minihompyId(minihompyId)
							.visitorId(viewerId)
							.visitedAt(LocalDateTime.now())
							.build();

					visitLogMapper.insertVisit(visitLog);

				} catch(Exception e) {
					log.warn("방문 기록 실패: ownerId={}, viewerId={}", ownerId, viewerId, e);
				}
			}
		}

		// 방문자 수(Today/Total)는 DB 컬럼이 아니라 별도 조회 결과를 조립한 값
		MinihompyMainResponse.VisitorCount visitorCount = MinihompyMainResponse.VisitorCount.builder()
				.today(visitLogMapper.countToday(ownerId))
				.total(visitLogMapper.countTotal(ownerId))
				.build();

		// 계산된 owner 여부를 응답에 채워서 리턴 (프론트가 편집 UI 노출 여부 판단에 사용)
		return response.toBuilder()
				.owner(isOwner)
				.visitorCount(visitorCount)
				.build();
	}


	// 접근 권한 체크(PRIVATE는 무조건 차단, FRIEND는 일촌 여부 확인, ALL은 통과)
	private void checkAccessPermission(Minihompy.AccessLevel accessLevel, Long ownerId, Long viewerId) {

		switch (accessLevel) {
			case PRIVATE -> throw new BusinessException(ErrorCode.MINIHOMPY_FORBIDDEN);
			case FRIEND ->  {

				if(viewerId == null || !friendMapper.isFriend(ownerId, viewerId)) {
					throw new BusinessException(ErrorCode.MINIHOMPY_FORBIDDEN);
				}

			}
			case ALL -> {/* 누구나 조회 가능 */} // 빈 블록으로 그냥 통과 시킴
		}
	}


	// 프로필 사진 업로드/변경 (공용 StorageService 사용)
	@Transactional
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


	// 프로필 사진 삭제
	@Transactional
	public void deleteProfileImage(Long userId) {

		profileMediaMapper.deleteMedia(Media.TargetType.PROFILE, userId);

	}


	// 파일 검증
	private void validateImageFile(MultipartFile file) {

		// 파일이 없는 경우
		if(file.isEmpty()) {
			throw new BusinessException(ErrorCode.INVALID_INPUT);
		}

		// 파일 크기 초과 확인
		if(file.getSize() > MAX_FILE_SIZE) {
			throw new BusinessException(ErrorCode.PROFILE_IMAGE_SIZE_EXCEEDED);
		}

		String originalFilename = file.getOriginalFilename();

		// 파일명이 이상하거나(없거나) 확장자가 없는 경우
		if(originalFilename == null || !originalFilename.contains(".")) {
			throw new BusinessException(ErrorCode.INVALID_FILE_EXTENSION);
		}

		// 확장자 추출 및 소문자로 통일
		String ext = originalFilename
				.substring(originalFilename.lastIndexOf('.') + 1)
				.toLowerCase(Locale.ROOT);

		// 허용된 확장자가 아닌 경우
		if(!ALLOWED_EXTENSIONS.contains(ext)) {
			throw new BusinessException(ErrorCode.INVALID_FILE_EXTENSION);
		}

		// 확장자만 바꿔치기한 위장 파일 방지 - 실제로 이미지로 디코딩 가능한지 확인
		BufferedImage image;

		try {
			/*
			* 진짜 이미지로 해석할 수 있는지 시도
			* - 진짜 이미지 파일이면 내용을 성공적으로 해석해서 BufferedImage 반환
			* - 가짜일 경우 해석 실패로 null 반환
			*/
			image = ImageIO.read(file.getInputStream());
		} catch (IOException e) {
			// 파일을 읽는 과정 자체에서 문제가 생길 경우
			throw new BusinessException(ErrorCode.INVALID_FILE_EXTENSION);
		}

		// 파일명은 .jpg(이미지 확장자)인데 내용은 진짜 이미지가 아닌 경우
		if (image == null) {
			throw new BusinessException(ErrorCode.INVALID_FILE_EXTENSION);
		}

	}


	// 미니홈피 설정 변경 (공개범위 + 소개글 + 기분 한번에)
	@Transactional
	public MinihompyMainResponse updateSettings(Long userId, MinihompySettingsRequest request) {

		int updated = minihompyMapper.updateSettings(
				userId,
				request.getAccessLevel(),
				request.getIntroduction(),
				request.getMood()
		);

		// 미니홈피 없는 이상 상황 대비 방어 코드
		if(updated == 0) {
			throw new BusinessException(ErrorCode.MINIHOMPY_NOT_FOUND);
		}

		// 갱신된 전체 데이터를 owner/visitorCount까지 정상 조립해서 리턴(프론트에서 응답받은 데이터로 화면 갱신용)
		return getMinihompyMain(userId, userId); // getMinihompyMain과 동일한 조립 과정 재사용

	}

}
