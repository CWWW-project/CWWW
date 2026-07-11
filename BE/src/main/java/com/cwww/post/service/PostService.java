package com.cwww.post.service;

import com.cwww.post.dto.PostCreateRequest;
import com.cwww.post.dto.PostResponse;
import com.cwww.post.dto.PostUpdateRequest;

public interface PostService {

    PostResponse createPost(Long userId, PostCreateRequest request);

    PostResponse getPost(Long viewerId, Long postId);

    void incrementViewCount(Long postId);

    void updatePost(Long userId, Long postId, PostUpdateRequest request);

    void deletePost(Long userId, Long postId);
}
