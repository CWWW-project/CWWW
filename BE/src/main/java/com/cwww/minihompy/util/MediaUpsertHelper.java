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
 * media 테이블에 "있으면 UPDATE, 없으면 INSERT"하는 select-then-branch 로직 공용화
 * 프로필 사진, 배경 사진 업로드에서 공통으로 사용 (중복 제거)
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

        // 해당 유저가 이미 프로필/배경화면 사진이 있는지 확인
        Media existing = profileMediaMapper.selectMedia(targetType, targetId);

        int affected;

        if(existing != null) {

            // 있으면 mediaId 기준으로 갱신(mediaUrl만 새 걸로 바꿔치기)
            existing.setMediaUrl(mediaUrl);
            affected = profileMediaMapper.updateMedia(existing);

        } else {

            // 없으면 신규 insert
            Media media = Media.builder()
                    .targetType(targetType)
                    .targetId(targetId)
                    .mediaUrl(mediaUrl)
                    .createdAt(LocalDateTime.now())
                    .build();

            affected = profileMediaMapper.insertMedia(media);

        }

        if(affected != 1) {
            throw new BusinessException(ErrorCode.FILE_UPLOAD_FAILED);
        }

        return mediaUrl;

    }

}
