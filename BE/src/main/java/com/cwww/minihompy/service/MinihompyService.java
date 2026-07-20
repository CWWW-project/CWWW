package com.cwww.minihompy.service;

import com.cwww.friend.mapper.FriendMapper;
import com.cwww.minihompy.domain.Media;
import com.cwww.minihompy.domain.Minihompy;
import com.cwww.minihompy.dto.request.MinihompySettingsRequest;
import com.cwww.minihompy.dto.response.BgmApplyResponse;
import com.cwww.minihompy.dto.response.BgmOptionResponse;
import com.cwww.minihompy.dto.response.ProfileImageResponse;
import com.cwww.minihompy.mapper.MinihompyBgmMapper;
import com.cwww.minihompy.mapper.ProfileMediaMapper;
import com.cwww.minihompy.mapper.VisitLogMapper;
import com.cwww.minihompy.util.MediaUpsertHelper;
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

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class MinihompyService {
	
	private final MinihompyMapper minihompyMapper;
	private final ProfileMediaMapper profileMediaMapper;
	private final UserMapper userMapper;
	private final FriendMapper friendMapper;
	private final VisitLogMapper visitLogMapper;
	private final MinihompyBgmMapper minihompyBgmMapper;

	private final VisitLogService visitLogService;

	private final MediaUpsertHelper mediaUpsertHelper;



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

			// 로그인한 유저일 경우
			if(viewerId != null) {

				try {
					visitLogService.recordVisit(ownerId, viewerId);
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
			case ALL -> {

				// 비회원(비로그인)은 ALL이어도 차단 - 반드시 로그인해야 조회 가능
				if(viewerId == null) {
					throw new BusinessException(ErrorCode.MINIHOMPY_FORBIDDEN);
				}

			}
		}
	}

	// 회원 탈퇴 시 미니홈피 소프트 삭제 (auth 도메인 탈퇴 처리 흐름에서 호출)
	@Transactional
	public void softDeleteMinihompy(Long userId) {
		minihompyMapper.softDeleteByUserId(userId);
	}


	// 프로필 사진 업로드/변경 (공용 StorageService 사용)
	@Transactional
	public ProfileImageResponse uploadProfileImage(Long userId, MultipartFile file) {

		// 검증 -> 저장소 업로드 -> media 테이블 upsert까지 MediaUpsertHelper가 전부 처리
		String imageUrl = mediaUpsertHelper.upload(Media.TargetType.PROFILE, userId, file);

		return ProfileImageResponse.builder()
				.profileImageUrl(imageUrl)
				.build();

	}


	// 프로필 사진 삭제
	@Transactional
	public void deleteProfileImage(Long userId) {

		profileMediaMapper.deleteMedia(Media.TargetType.PROFILE, userId);

	}


	// 미니홈피 설정 변경 (공개범위 + 소개글 + 기분 한번에 설정)
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


	// 내가 보유한 BGM 목록 조회
	public List<BgmOptionResponse> getBgmOptions(Long userId) {

		// 미니홈피가 없으면 "보유 없음"과 구분해서 명확히 404 처리
		if (minihompyBgmMapper.countMinihompyByUserId(userId) == 0) {
			throw new BusinessException(ErrorCode.MINIHOMPY_NOT_FOUND);
		}

		List<BgmOptionResponse> response = minihompyBgmMapper.selectOwnedBgmOptions(userId);

		return response;
	}


	// BGM 적용 (또는 끄기)
	@Transactional
	public BgmApplyResponse applyBgm(Long userId, Long itemId) {

		// 미니홈피 존재 여부를 가장 먼저 확인 (itemId가 있든 없든 공통)
		if (minihompyBgmMapper.countMinihompyByUserId(userId) == 0) {
			throw new BusinessException(ErrorCode.MINIHOMPY_NOT_FOUND);
		}

		// 선택한 BGM이 없는 경우
		if (itemId == null) {

			// BGM 안 씀 -> 그냥 끄기
			minihompyBgmMapper.clearBgm(userId);

			return BgmApplyResponse.builder()
					.itemId(null)
					.mediaUrl(null)
					.build();

		}

		// 진짜 이 유저가 이 아이템을 보유하고 있는지 재검증
		if (minihompyBgmMapper.countOwnedBgmItem(userId, itemId) == 0) {
			throw new BusinessException(ErrorCode.BGM_NOT_OWNED);
		}

		// BGM 적용
		int updated = minihompyBgmMapper.applyBgm(userId, itemId);

		if(updated == 0) {
			throw new BusinessException(ErrorCode.MINIHOMPY_NOT_FOUND);
		}

		// 방금 적용한 BGM의 재생 URL 조회해서 같이 응답
		String mediaUrl = minihompyBgmMapper.selectMediaUrlByItemId(itemId);

		return BgmApplyResponse.builder()
				.itemId(itemId)
				.mediaUrl(mediaUrl)
				.build();

	}

}
