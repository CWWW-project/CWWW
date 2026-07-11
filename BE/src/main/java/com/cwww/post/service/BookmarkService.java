package com.cwww.post.service;

import com.cwww.post.dto.FeedResponse;

public interface BookmarkService {

    void bookmark(Long userId, Long postId);

    void unbookmark(Long userId, Long postId);

    FeedResponse getBookmarks(Long userId, Long cursor, int size);
}
