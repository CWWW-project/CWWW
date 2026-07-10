package com.cwww.post.service;

import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface MediaService {

    String upload(MultipartFile file);

    List<String> uploadAll(List<MultipartFile> files);
}
