package com.cwww.post.service;

import com.cwww.global.exception.BusinessException;
import com.cwww.global.exception.ErrorCode;
import com.cwww.post.domain.Post;
import com.cwww.post.dto.FeedResponse;
import com.cwww.post.dto.PostResponse;
import com.cwww.post.mapper.BookmarkMapper;
import com.cwww.post.mapper.HashtagMapper;
import com.cwww.post.mapper.MediaMapper;
import com.cwww.post.mapper.PostMapper;
import com.cwww.user.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BookmarkServiceImpl implements BookmarkService {

    private final PostMapper postMapper;
    private final BookmarkMapper bookmarkMapper;
    private final UserMapper userMapper;
    private final HashtagMapper hashtagMapper;
    private final MediaMapper mediaMapper;

    @Override
    @Transactional
    public void bookmark(Long userId, Long postId) {
        postMapper.findById(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));

        int inserted = bookmarkMapper.insert(postId, userId);
        if (inserted == 0) {
            throw new BusinessException(ErrorCode.ALREADY_BOOKMARKED);
        }
    }

    @Override
    @Transactional
    public void unbookmark(Long userId, Long postId) {
        int deleted = bookmarkMapper.delete(postId, userId);
        if (deleted == 0) {
            throw new BusinessException(ErrorCode.NOT_BOOKMARKED);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public FeedResponse getBookmarks(Long userId, Long cursor, int size) {
        List<Post> posts = bookmarkMapper.findBookmarkedPosts(userId, cursor, size + 1);

        boolean hasNext = posts.size() > size;
        if (hasNext) {
            posts = posts.subList(0, size);
        }

        Long nextCursor = hasNext ? posts.get(posts.size() - 1).getPostId() : null;

        List<PostResponse> responses = posts.stream()
                .map(post -> {
                    String nickname = userMapper.findNicknameById(post.getUserId());
                    List<String> hashtags = hashtagMapper.findNamesByPostId(post.getPostId());
                    List<String> mediaUrls = mediaMapper.findUrlsByTarget("POST", post.getPostId());
                    return PostResponse.from(post, nickname, hashtags, mediaUrls);
                })
                .toList();

        return FeedResponse.builder()
                .posts(responses)
                .nextCursor(nextCursor)
                .hasNext(hasNext)
                .build();
    }
}
