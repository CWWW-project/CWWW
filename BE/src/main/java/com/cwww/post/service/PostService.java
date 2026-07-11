package com.cwww.post.service;

import com.cwww.post.dto.FeedResponse;
import com.cwww.post.dto.PostCreateRequest;
import com.cwww.post.dto.PostResponse;
import com.cwww.post.dto.PostUpdateRequest;

public interface PostService {

    PostResponse createPost(Long userId, PostCreateRequest request);

    PostResponse getPost(Long viewerId, Long postId);

    void incrementViewCount(Long postId);

    void updatePost(Long userId, Long postId, PostUpdateRequest request);

    void deletePost(Long userId, Long postId);

    FeedResponse getFeed(Long viewerId, Long cursor, int size);

    void likePost(Long userId, Long postId);

    void unlikePost(Long userId, Long postId);

    FeedResponse searchByHashtag(String tag, Long cursor, int size);
}
