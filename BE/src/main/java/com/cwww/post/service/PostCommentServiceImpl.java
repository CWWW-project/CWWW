package com.cwww.post.service;

import com.cwww.post.mapper.PostCommentMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PostCommentServiceImpl implements PostCommentService {

    private final PostCommentMapper postCommentMapper;

    // TODO: POST-007 댓글 작성/조회
    // TODO: POST-008 댓글 수정/삭제
}
