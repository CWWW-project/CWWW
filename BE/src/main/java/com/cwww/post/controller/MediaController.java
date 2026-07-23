package com.cwww.post.controller;

import com.cwww.global.response.ApiResponse;
import com.cwww.post.service.MediaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/media")
@RequiredArgsConstructor
public class MediaController {

    private final MediaService mediaService;

    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<List<String>>> upload(
            @RequestParam("files") List<MultipartFile> files) {
        List<String> urls = mediaService.uploadAll(files);
        return ResponseEntity.ok(ApiResponse.success(urls));
    }
}
