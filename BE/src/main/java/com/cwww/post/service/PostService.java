package com.cwww.post.service;

import com.cwww.post.dto.PostCreateRequest;
import com.cwww.post.dto.PostResponse;

public interface PostService {

    PostResponse createPost(Long userId, PostCreateRequest request);

    PostResponse getPost(Long viewerId, Long postId);

    void incrementViewCount(Long postId);
}
