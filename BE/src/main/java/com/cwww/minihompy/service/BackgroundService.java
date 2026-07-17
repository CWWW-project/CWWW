package com.cwww.minihompy.service;

import com.cwww.global.exception.BusinessException;
import com.cwww.global.exception.ErrorCode;
import com.cwww.minihompy.domain.BackgroundDotOption;
import com.cwww.minihompy.domain.Media;
import com.cwww.minihompy.dto.response.BackgroundDotOptionResponse;
import com.cwww.minihompy.dto.response.BackgroundResponse;
import com.cwww.minihompy.mapper.MinihompyMapper;
import com.cwww.minihompy.mapper.ProfileMediaMapper;
import com.cwww.minihompy.util.MediaUpsertHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.List;

/*
 * 배경화면 전담 Service
 * 도트(땡땡이) 색상 선택 또는 사진 직접 업로드, 둘 중 하나만 활성화됨
 * (색상 선택 시 minihompy.background_color, 사진 업로드 시 media 테이블 사용, 서로 배타적으로 초기화)
 */
@Service
@RequiredArgsConstructor
public class BackgroundService {

    private final MinihompyMapper minihompyMapper;
    private final ProfileMediaMapper profileMediaMapper;

    private final MediaUpsertHelper mediaUpsertHelper;

    // 도트 배경 선택지 목록 조회 (고정)
    public List<BackgroundDotOptionResponse> getBackgroundDotOptions() {

        return Arrays.stream(BackgroundDotOption.values())
                .map(option -> BackgroundDotOptionResponse.builder()
                        .code(option.getCode())
                        .hex(option.getHex())
                        .build())
                .toList();

    }


    // 도트 배경 적용 (색상은 minihompy.background_color에 저장, 기존 배경 사진은 소프트 삭제)
    @Transactional
    public BackgroundResponse applyDotBackground(Long userId, String code) {

        // 존재 확인 + 행 잠금 (동시에 사진 업로드 요청이 들어와도 이 트랜잭션 끝날 때까지 대기하게 함)
        if (minihompyMapper.lockMinihompyByUserId(userId) == null) {
            throw new BusinessException(ErrorCode.MINIHOMPY_NOT_FOUND);
        }

        // 색상 코드 받아서 일치하는 코드가 있는지 확인
        BackgroundDotOption option = BackgroundDotOption.fromCode(code);

        // 유효하지 않은 색상 코드가 들어온 경우
        if(option == null) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }

        int updated = minihompyMapper.updateBackgroundColor(userId, option.getHex());

        if(updated == 0) {
            throw new BusinessException(ErrorCode.MINIHOMPY_NOT_FOUND);
        }

        // 색상으로 전환하는 거니, 혹시 있던 배경 사진은 지움 (둘 중 하나만 활성화)
        profileMediaMapper.deleteMedia(Media.TargetType.BACKGROUND, userId);

        return BackgroundResponse.builder()
                .value(option.getHex())
                .build();

    }


    // 사진 배경 업로드 (공용 StorageService 사용)
    @Transactional
    public BackgroundResponse uploadPhotoBackground(Long userId, MultipartFile file) {

        // 존재 확인 + 행 잠금 (동시에 도트 적용 요청이 들어와도 이 트랜잭션 끝날 때까지 대기하게 함)
        if (minihompyMapper.lockMinihompyByUserId(userId) == null) {
            throw new BusinessException(ErrorCode.MINIHOMPY_NOT_FOUND);
        }

        // 검증 -> 저장소 업로드 -> media 테이블 upsert까지 MediaUpsertHelper가 전부 처리
        String imageUrl = mediaUpsertHelper.upload(Media.TargetType.BACKGROUND, userId, file);

        // 사진으로 전환하는 거라 색상 설정 지움
        minihompyMapper.updateBackgroundColor(userId, null);

        return BackgroundResponse.builder()
                .value(imageUrl)
                .build();

    }

}
