package com.cwww.post.controller;

import com.cwww.post.service.PostCommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/posts/{postId}/comments")
@RequiredArgsConstructor
public class PostCommentController {

    private final PostCommentService postCommentService;

    // TODO: POST-007 댓글 작성/조회
    // TODO: POST-008 댓글 수정/삭제
}
