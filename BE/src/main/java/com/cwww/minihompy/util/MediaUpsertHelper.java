package com.cwww.minihompy.util;

import com.cwww.global.exception.BusinessException;
import com.cwww.global.exception.ErrorCode;
import com.cwww.global.storage.StorageService;
import com.cwww.minihompy.domain.Media;
import com.cwww.minihompy.mapper.ProfileMediaMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;

/*
 * 이미지 검증 -> 저장소 업로드 -> media 테이블 반영까지 한 번에 처리
 * 프로필 사진, 배경 사진 업로드에서 공통으로 사용 (중복 제거)
 * uq_media_profile_singleton / uq_media_background_singleton 인덱스 기준
 * 원자적 upsert로 처리 (동시 업로드 race condition 방지)
 */
@Component
@RequiredArgsConstructor
public class MediaUpsertHelper {

    private final ProfileMediaMapper profileMediaMapper;
    private final ImageValidator imageValidator;
    private final StorageService storageService;

    // 검증 -> 저장소 업로드 -> media 테이블 반영까지 전부 처리, 최종 URL 반환
    public String upload(Media.TargetType targetType, Long targetId, MultipartFile file) {

        // 파일 검증
        imageValidator.validateImageFile(file);

        // 새 파일 먼저 저장(기존 것 아직 안 거드림, 실패해도 기존 사진 안전)
        String mediaUrl = storageService.store(file);


        // 없으면 신규 insert
        Media media = Media.builder()
                .targetType(targetType)
                .targetId(targetId)
                .mediaUrl(mediaUrl)
                .createdAt(LocalDateTime.now())
                .build();

        // select-then-branch 대신 원자적 upsert - DB가 있으면 UPDATE, 없으면 INSERT를 한 번에 처리
        profileMediaMapper.upsertMedia(media);

        return mediaUrl;

    }

}
