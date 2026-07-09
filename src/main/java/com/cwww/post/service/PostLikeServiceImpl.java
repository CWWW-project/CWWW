package com.cwww.post.service;

import com.cwww.post.mapper.PostMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PostLikeServiceImpl implements PostLikeService {

    private final PostMapper postMapper;

    // TODO: POST-006 좋아요 등록/취소
}
