package com.cwww.post.controller;

import com.cwww.global.response.ApiResponse;
import com.cwww.post.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    // TODO: POST-001 다이어리 작성
    // TODO: POST-003 다이어리 조회
    // TODO: POST-004 다이어리 수정/삭제
    // TODO: POST-005 피드 조회
}
