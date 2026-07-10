package com.cwww.post.service;

import com.cwww.post.dto.PostCreateRequest;
import com.cwww.post.dto.PostResponse;

public interface PostService {

    PostResponse createPost(Long userId, PostCreateRequest request);
}
