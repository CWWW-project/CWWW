package com.cwww.post.service;

import com.cwww.global.exception.BusinessException;
import com.cwww.global.exception.ErrorCode;
import com.cwww.global.storage.StorageService;
import com.cwww.post.mapper.MediaMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class MediaServiceImpl implements MediaService {

    private static final long MAX_FILE_SIZE = 10L * 1024 * 1024; // 10MB
    private static final List<String> ALLOWED_EXTENSIONS = List.of("jpg", "jpeg", "png", "gif");

    private final StorageService storageService;
    private final MediaMapper mediaMapper;

    @Override
    public String upload(MultipartFile file) {
        validateFileSize(file);
        validateExtension(file);
        return storageService.store(file);
    }

    @Override
    public List<String> uploadAll(List<MultipartFile> files) {
        files.forEach(file -> {
            validateFileSize(file);
            validateExtension(file);
        });
        return files.stream()
                .map(storageService::store)
                .toList();
    }

    private void validateFileSize(MultipartFile file) {
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BusinessException(ErrorCode.FILE_SIZE_EXCEEDED);
        }
    }

    private void validateExtension(MultipartFile file) {
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !originalFilename.contains(".")) {
            throw new BusinessException(ErrorCode.INVALID_FILE_EXTENSION);
        }
        String ext = originalFilename.substring(originalFilename.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
        if (!ALLOWED_EXTENSIONS.contains(ext)) {
            throw new BusinessException(ErrorCode.INVALID_FILE_EXTENSION);
        }
    }
}
