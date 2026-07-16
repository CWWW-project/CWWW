package com.cwww.minihompy.util;

import com.cwww.global.exception.BusinessException;
import com.cwww.global.exception.ErrorCode;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Locale;

/*
 * 이미지 파일 업로드 검증 공용 컴포넌트
 * 프로필 사진, 배경 사진 업로드에서 공통으로 사용 (중복 제거)
 */
@Component
public class ImageValidator {

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    private static final List<String> ALLOWED_EXTENSIONS = List.of("jpg", "jpeg", "png");

    public void validateImageFile(MultipartFile file) {

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

        try (InputStream inputStream = file.getInputStream()) {
            /*
             * 진짜 이미지로 해석할 수 있는지 시도
             * - 진짜 이미지 파일이면 내용을 성공적으로 해석해서 BufferedImage 반환
             * - 가짜일 경우 해석 실패로 null 반환
             */
            image = ImageIO.read(inputStream);
        } catch (IOException e) {
            // 파일을 읽는 과정 자체에서 문제가 생길 경우
            throw new BusinessException(ErrorCode.INVALID_FILE_EXTENSION);
        }

        // 파일명은 .jpg(이미지 확장자)인데 내용은 진짜 이미지가 아닌 경우
        if(image == null) {
            throw new BusinessException(ErrorCode.INVALID_FILE_EXTENSION);
        }

    }

}
