package com.cwww.global.storage;

import com.cwww.global.exception.BusinessException;
import com.cwww.global.exception.ErrorCode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Locale;
import java.util.UUID;

@Service
public class LocalStorageServiceImpl implements StorageService {

    @Value("${storage.local.path:uploads}")
    private String uploadPath;

    @Value("${storage.local.base-url:http://localhost:8080/uploads}")
    private String baseUrl;

    @Override
    public String store(MultipartFile file) {
        String ext = extractExtension(file.getOriginalFilename());
        String filename = UUID.randomUUID() + "." + ext;

        Path root = Paths.get(uploadPath).toAbsolutePath().normalize();
        Path target = root.resolve(filename).normalize();

        if (!target.startsWith(root)) {
            throw new BusinessException(ErrorCode.FILE_UPLOAD_FAILED);
        }

        try {
            Files.createDirectories(root);
            file.transferTo(target.toFile());
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.FILE_UPLOAD_FAILED);
        }

        return baseUrl.stripTrailing().replaceAll("/+$", "") + "/" + filename;
    }

    private String extractExtension(String originalFilename) {
        if (originalFilename == null || !originalFilename.contains(".")) {
            throw new BusinessException(ErrorCode.INVALID_FILE_EXTENSION);
        }
        return originalFilename.substring(originalFilename.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
    }
}
