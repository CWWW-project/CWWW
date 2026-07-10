package com.cwww.post.service;

import org.springframework.web.multipart.MultipartFile;

public interface MediaService {

    String upload(MultipartFile file);
}
