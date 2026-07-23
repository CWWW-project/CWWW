package com.cwww.post.service;

import com.cwww.global.exception.BusinessException;
import com.cwww.global.exception.ErrorCode;
import com.cwww.global.storage.StorageService;
import com.cwww.post.mapper.MediaMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
class MediaServiceTest {

    @Mock
    private StorageService storageService;

    @Mock
    private MediaMapper mediaMapper;

    @InjectMocks
    private MediaServiceImpl mediaService;

    @Test
    @DisplayName("이미지 업로드 성공")
    void upload_success() {
        // Arrange
        MockMultipartFile file = new MockMultipartFile(
                "file", "test.jpg", "image/jpeg", new byte[1024]
        );
        given(storageService.store(any())).willReturn("http://localhost/uploads/test.jpg");

        // Act
        String url = mediaService.upload(file);

        // Assert
        assertThat(url).isEqualTo("http://localhost/uploads/test.jpg");
    }

    @Test
    @DisplayName("허용되지 않는 확장자 업로드 시 예외")
    void upload_invalidExtension() {
        // Arrange
        MockMultipartFile file = new MockMultipartFile(
                "file", "malicious.exe", "application/octet-stream", new byte[1024]
        );

        // Act & Assert
        assertThatThrownBy(() -> mediaService.upload(file))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.INVALID_FILE_EXTENSION);
    }

    @Test
    @DisplayName("파일 크기 초과 시 예외 (10MB)")
    void upload_fileSizeExceeded() {
        // Arrange
        MockMultipartFile file = new MockMultipartFile(
                "file", "big.jpg", "image/jpeg", new byte[11 * 1024 * 1024]
        );

        // Act & Assert
        assertThatThrownBy(() -> mediaService.upload(file))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.FILE_SIZE_EXCEEDED);
    }
}
