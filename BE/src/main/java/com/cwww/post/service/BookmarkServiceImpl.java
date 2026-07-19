package com.cwww.post.service;

import com.cwww.global.exception.BusinessException;
import com.cwww.global.exception.ErrorCode;
import com.cwww.post.domain.Media;
import com.cwww.post.domain.Post;
import com.cwww.post.dto.FeedResponse;
import com.cwww.post.dto.PostHashtagDto;
import com.cwww.post.dto.PostResponse;
import com.cwww.post.mapper.BookmarkMapper;
import com.cwww.post.mapper.HashtagMapper;
import com.cwww.post.mapper.MediaMapper;
import com.cwww.post.mapper.PostLikeMapper;
import com.cwww.post.mapper.PostMapper;
import com.cwww.user.domain.User;
import com.cwww.user.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookmarkServiceImpl implements BookmarkService {

    private final PostMapper postMapper;
    private final BookmarkMapper bookmarkMapper;
    private final UserMapper userMapper;
    private final HashtagMapper hashtagMapper;
    private final MediaMapper mediaMapper;
    private final PostLikeMapper postLikeMapper;

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

        List<PostResponse> responses = toPostResponses(posts, userId);

        return FeedResponse.builder()
                .posts(responses)
                .nextCursor(nextCursor)
                .hasNext(hasNext)
                .build();
    }

    private List<PostResponse> toPostResponses(List<Post> posts, Long userId) {
        if (posts.isEmpty()) {
            return List.of();
        }

        List<Long> postIds = posts.stream().map(Post::getPostId).toList();
        List<Long> userIds = posts.stream().map(Post::getUserId).distinct().toList();

        Map<Long, String> nicknameMap = userMapper.findByIds(userIds).stream()
                .collect(Collectors.toMap(User::getUserId, User::getNickname));
        Map<Long, List<String>> hashtagMap = hashtagMapper.findAllByPostIds(postIds).stream()
                .collect(Collectors.groupingBy(PostHashtagDto::postId,
                        Collectors.mapping(PostHashtagDto::name, Collectors.toList())));
        Map<Long, List<String>> mediaMap = mediaMapper.findAllByTargets("POST", postIds).stream()
                .collect(Collectors.groupingBy(Media::getTargetId,
                        Collectors.mapping(Media::getMediaUrl, Collectors.toList())));

        java.util.Set<Long> likedPostIds = postLikeMapper.findLikedPostIds(userId, postIds);

        return posts.stream()
                .map(post -> PostResponse.from(post,
                        nicknameMap.getOrDefault(post.getUserId(), ""),
                        likedPostIds.contains(post.getPostId()),
                        true,
                        hashtagMap.getOrDefault(post.getPostId(), List.of()),
                        mediaMap.getOrDefault(post.getPostId(), List.of())))
                .toList();
    }
}
