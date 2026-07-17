package com.cwww.minihompy.util;

import com.cwww.global.exception.BusinessException;
import com.cwww.global.exception.ErrorCode;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.util.Iterator;
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

    // 압축 폭탄 방지 - 작은 파일이 디코딩 시 거대한 래스터로 부풀려지는 것을 막기 위한 최대 픽셀 수 (약 2000x2000)
    private static final long MAX_PIXELS = 4_000_000L;

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

        /*
         * 확장자만 바꿔치기한 위장 파일 방지 + 압축 폭탄 방지
         * ImageIO.read()로 바로 전체 디코딩하면, 작은 압축 파일이 거대한 픽셀로 풀리면서
         * 서버 메모리(힙)를 소진시킬 수 있음(압축 폭탄).
         * 그래서 ImageReader로 가로/세로만 먼저 가볍게 읽어서 픽셀 수를 검증한 뒤,
         * 문제없을 때만 실제 전체 디코딩(read)을 진행함
         */
        try(ImageInputStream iis = ImageIO.createImageInputStream(file.getInputStream())) {

            // 이미지 파일을 읽을 준비 자체가 안 되는 경우 (파일이 심각하게 손상됐거나 형식이 이상함)
            if(iis == null) {
                throw new BusinessException(ErrorCode.INVALID_FILE_EXTENSION);
            }

            /*
             * ImageReader = "이미지 해석 전문가" 같은 존재.
             * jpg/png 등 형식에 맞는 해석기를 자동으로 찾아줌.
             * getImageReaders()는 "이 파일을 해석할 수 있는 후보들"을 리스트로 돌려줌.
             */
            Iterator<ImageReader> readers = ImageIO.getImageReaders(iis);

            if(!readers.hasNext()) {
                // 이미지로 해석할 수 있는 리더가 없음 = 진짜 이미지가 아님
                throw new BusinessException(ErrorCode.INVALID_FILE_EXTENSION);
            }

            // 후보들 중 첫 번째 리더를 사용
            ImageReader reader = readers.next();

            try {

                // 실제 이미지 포맷(png/jpg)이 맞는지 확인 (다른 이미지 포맷으로 위장한 경우 차단)
                String formatName = reader.getFormatName().toLowerCase(Locale.ROOT);
                boolean formatMatchesExtension = switch(ext) {
                    case "png" -> formatName.contains("png");
                    case "jpg", "jpeg" -> formatName.contains("jpeg") || formatName.contains("jpg");
                    default -> false;
                };

                // 실제 이미지 포맷(png/jpg)이 아닌 경우
                if (!formatMatchesExtension) {
                    throw new BusinessException(ErrorCode.INVALID_FILE_EXTENSION);
                }

                // 이 리더한테 "이 파일을 읽을 준비를 해라"고 지정해줌
                reader.setInput(iis, true, true);

                // 가로/세로만 먼저 읽음 (대부분의 포맷에서 전체 픽셀 디코딩 없이 헤더만으로 가능)
                int width = reader.getWidth(0);
                int height = reader.getHeight(0);

                // 가로 X 세로 = 총 픽셀 수. int끼리 곱하면 숫자가 넘칠 수 있어서 long으로 계산
                long pixels = (long) width * (long) height;

                // 정해둔 한도(약 2000x2000 = 400만 픽셀)보다 크면, 더 이상 진행하지 않고 바로 거부
                if(pixels > MAX_PIXELS) {
                    throw new BusinessException(ErrorCode.IMAGE_DIMENSION_EXCEEDED);
                }

                // 픽셀 수 검증 통과했을 때만 실제 전체 디코딩 (진짜 이미지인지 최종 확인)
                BufferedImage image = reader.read(0);

                if(image == null) {
                    throw new BusinessException(ErrorCode.INVALID_FILE_EXTENSION);
                }

            } finally {
                // 리더가 쓰던 내부 자원을 정리 (안 하면 메모리 누수 발생 가능)
                reader.dispose();
            }

        } catch(IOException e) {
            // 파일을 읽는 과정 자체에서 예상 못한 문제가 생긴 경우
            throw new BusinessException(ErrorCode.INVALID_FILE_EXTENSION);
        }

    }

}
