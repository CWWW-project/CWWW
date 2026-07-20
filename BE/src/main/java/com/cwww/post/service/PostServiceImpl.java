package com.cwww.post.service;

import com.cwww.friend.mapper.FriendMapper;
import com.cwww.global.exception.BusinessException;
import com.cwww.global.exception.ErrorCode;
import com.cwww.global.notification.dto.NotificationEvent;
import com.cwww.global.notification.redis.RedisNotificationPublisher;
import com.cwww.post.domain.Hashtag;
import com.cwww.post.domain.Media;
import com.cwww.post.domain.Post;
import com.cwww.post.dto.FeedResponse;
import com.cwww.post.dto.PostCreateRequest;
import com.cwww.post.dto.PostHashtagDto;
import com.cwww.post.dto.PostResponse;
import com.cwww.post.dto.PostUpdateRequest;
import com.cwww.post.mapper.BookmarkMapper;
import com.cwww.post.mapper.HashtagMapper;
import com.cwww.post.mapper.MediaMapper;
import com.cwww.post.mapper.PostLikeMapper;
import com.cwww.post.mapper.PostMapper;
import com.cwww.user.domain.User;
import com.cwww.user.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PostServiceImpl implements PostService {

    private final PostMapper postMapper;
    private final MediaMapper mediaMapper;
    private final HashtagMapper hashtagMapper;
    private final FriendMapper friendMapper;
    private final PostLikeMapper postLikeMapper;
    private final BookmarkMapper bookmarkMapper;
    private final UserMapper userMapper;
    private final RedisNotificationPublisher notificationPublisher;

    @Override
    @Transactional
    public PostResponse createPost(Long userId, PostCreateRequest request) {
        Post post = Post.builder()
                .userId(userId)
                .minihompyId(request.getMinihompyId())
                .title(request.getTitle())
                .content(request.getContent())
                .visibility(request.getVisibility())
                .build();

        postMapper.insert(post);
        saveHashtags(post.getPostId(), request.getHashtags());
        saveMediaUrls(post.getPostId(), request.getMediaUrls());

        String nickname = userMapper.findNicknameById(userId);
        return PostResponse.from(post, nickname, false, false, request.getHashtags(), request.getMediaUrls());
    }

    @Override
    @Transactional(readOnly = true)
    public PostResponse getPost(Long viewerId, Long postId) {
        Post post = postMapper.findById(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));

        checkVisibility(viewerId, post);

        String nickname = userMapper.findNicknameById(post.getUserId());
        boolean isLiked = postLikeMapper.exists(postId, viewerId);
        boolean isBookmarked = bookmarkMapper.findBookmarkedPostIds(viewerId, List.of(postId)).contains(postId);
        List<String> hashtags = hashtagMapper.findNamesByPostId(postId);
        List<String> mediaUrls = mediaMapper.findUrlsByTarget("POST", postId);

        return PostResponse.from(post, nickname, isLiked, isBookmarked, hashtags, mediaUrls);
    }

    @Override
    @Transactional
    public void incrementViewCount(Long postId) {
        postMapper.incrementViewCount(postId);
    }

    @Override
    @Transactional
    public void updatePost(Long userId, Long postId, PostUpdateRequest request) {
        Post post = postMapper.findById(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));

        if (!post.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.POST_FORBIDDEN);
        }

        post.setTitle(request.getTitle());
        post.setContent(request.getContent());
        post.setVisibility(request.getVisibility());

        postMapper.update(post);

        hashtagMapper.deleteByPostId(postId);
        saveHashtags(postId, request.getHashtags());
    }

    @Override
    @Transactional
    public void deletePost(Long userId, Long postId) {
        Post post = postMapper.findById(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));

        if (!post.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.POST_FORBIDDEN);
        }

        postMapper.softDelete(postId);
    }

    @Override
    @Transactional(readOnly = true)
    public FeedResponse getFeed(Long viewerId, Long cursor, int size) {
        List<Post> posts = postMapper.findFeed(viewerId, cursor, size + 1);

        boolean hasNext = posts.size() > size;
        if (hasNext) {
            posts = posts.subList(0, size);
        }

        Long nextCursor = hasNext ? posts.get(posts.size() - 1).getPostId() : null;

        List<PostResponse> responses = toPostResponses(posts, viewerId);

        return FeedResponse.builder()
                .posts(responses)
                .nextCursor(nextCursor)
                .hasNext(hasNext)
                .build();
    }

    @Override
    @Transactional
    public void likePost(Long userId, Long postId) {
        Post post = postMapper.findById(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));

        if (postLikeMapper.exists(postId, userId)) {
            throw new BusinessException(ErrorCode.ALREADY_LIKED);
        }

        postLikeMapper.insert(postId, userId);
        postMapper.incrementLikeCount(postId);

        if (!userId.equals(post.getUserId())) {
            try {
                String actorName = userMapper.findNicknameById(userId);
                notificationPublisher.publish(NotificationEvent.builder()
                        .eventType("LIKE")
                        .targetUserId(post.getUserId())
                        .actorId(userId)
                        .actorName(actorName)
                        .targetId(postId)
                        .targetType("POST")
                        .preview(actorName + "님이 게시글을 좋아합니다.")
                        .createdAt(java.time.LocalDateTime.now())
                        .build());
            } catch (Exception e) {
                log.warn("좋아요 알림 발행 실패: postId={}, userId={}", postId, userId, e);
            }
        }
    }

    @Override
    @Transactional
    public void unlikePost(Long userId, Long postId) {
        postMapper.findById(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));

        if (!postLikeMapper.exists(postId, userId)) {
            throw new BusinessException(ErrorCode.NOT_LIKED);
        }

        int deleted = postLikeMapper.delete(postId, userId);
        if (deleted == 1) {
            postMapper.decrementLikeCount(postId);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public FeedResponse searchByHashtag(Long viewerId, String tag, Long cursor, int size) {
        List<Post> posts = postMapper.findByHashtag(tag, cursor, size + 1);

        boolean hasNext = posts.size() > size;
        if (hasNext) {
            posts = posts.subList(0, size);
        }

        Long nextCursor = hasNext ? posts.get(posts.size() - 1).getPostId() : null;

        List<PostResponse> responses = toPostResponses(posts, viewerId);

        return FeedResponse.builder()
                .posts(responses)
                .nextCursor(nextCursor)
                .hasNext(hasNext)
                .build();
    }

    private List<PostResponse> toPostResponses(List<Post> posts, Long viewerId) {
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

        java.util.Set<Long> likedPostIds = (viewerId != null)
                ? postLikeMapper.findLikedPostIds(viewerId, postIds)
                : java.util.Set.of();
        java.util.Set<Long> bookmarkedPostIds = (viewerId != null)
                ? bookmarkMapper.findBookmarkedPostIds(viewerId, postIds)
                : java.util.Set.of();

        return posts.stream()
                .map(post -> PostResponse.from(post,
                        nicknameMap.getOrDefault(post.getUserId(), ""),
                        likedPostIds.contains(post.getPostId()),
                        bookmarkedPostIds.contains(post.getPostId()),
                        hashtagMap.getOrDefault(post.getPostId(), List.of()),
                        mediaMap.getOrDefault(post.getPostId(), List.of())))
                .toList();
    }

    private void checkVisibility(Long viewerId, Post post) {
        switch (post.getVisibility()) {
            case "PRIVATE" -> {
                if (!post.getUserId().equals(viewerId)) {
                    throw new BusinessException(ErrorCode.POST_FORBIDDEN);
                }
            }
            case "FRIEND" -> {
                if (!post.getUserId().equals(viewerId) && !friendMapper.isFriend(post.getUserId(), viewerId)) {
                    throw new BusinessException(ErrorCode.POST_FORBIDDEN);
                }
            }
            case "ALL" -> { }
            default -> throw new BusinessException(ErrorCode.POST_FORBIDDEN);
        }
    }

    private void saveHashtags(Long postId, List<String> hashtags) {
        for (String name : hashtags) {
            hashtagMapper.upsertHashtag(name);
            Hashtag hashtag = hashtagMapper.findByName(name);
            if (hashtag == null) {
                throw new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR);
            }
            hashtagMapper.linkToPost(postId, hashtag.getHashtagId());
        }
    }

    private void saveMediaUrls(Long postId, List<String> mediaUrls) {
        for (String url : mediaUrls) {
            Media media = Media.builder()
                    .targetType("POST")
                    .targetId(postId)
                    .mediaUrl(url)
                    .build();
            mediaMapper.insert(media);
        }
    }
}
