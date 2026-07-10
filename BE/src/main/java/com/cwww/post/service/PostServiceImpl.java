package com.cwww.post.service;

import com.cwww.post.mapper.PostMapper;
import com.cwww.post.mapper.MediaMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PostServiceImpl implements PostService {

    private final PostMapper postMapper;
    private final MediaMapper mediaMapper;

    // TODO: POST-001 다이어리 작성
    // TODO: POST-003 다이어리 조회
    // TODO: POST-004 다이어리 수정/삭제
    // TODO: POST-005 피드 조회
}
