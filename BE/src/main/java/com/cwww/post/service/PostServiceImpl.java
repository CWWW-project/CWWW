package com.cwww.post.service;

import com.cwww.friend.mapper.FriendMapper;
import com.cwww.global.exception.BusinessException;
import com.cwww.global.exception.ErrorCode;
import com.cwww.global.notification.dto.NotificationEvent;
import com.cwww.global.notification.redis.RedisNotificationPublisher;
import com.cwww.minihompy.service.MinihompyService;
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
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDateTime;
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
    private final MinihompyService minihompyService;

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

        // insert 직후 재조회 — DB가 NOW()로 채운 created_at/updated_at을 정확히 반영하기 위함
        Post savedPost = postMapper.findById(post.getPostId())
                .orElseThrow(() -> new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR));

        saveHashtags(savedPost.getPostId(), request.getHashtags());
        saveMediaUrls(savedPost.getPostId(), request.getMediaUrls());

        String nickname = userMapper.findNicknameById(userId);
        String profileImageUrl = mediaMapper.findUrlsByTarget("PROFILE", userId).stream().findFirst().orElse(null);
        publishPostCreatedNotifications(savedPost, nickname);
        return PostResponse.from(savedPost, nickname, profileImageUrl, false, false, request.getHashtags(), request.getMediaUrls());
    }

    @Override
    @Transactional(readOnly = true)
    public PostResponse getPost(Long viewerId, Long postId) {
        Post post = postMapper.findById(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));

        checkVisibility(viewerId, post);

        String nickname = userMapper.findNicknameById(post.getUserId());
        String profileImageUrl = mediaMapper.findUrlsByTarget("PROFILE", post.getUserId()).stream().findFirst().orElse(null);
        boolean isLiked = postLikeMapper.exists(postId, viewerId);
        boolean isBookmarked = bookmarkMapper.findBookmarkedPostIds(viewerId, List.of(postId)).contains(postId);
        List<String> hashtags = hashtagMapper.findNamesByPostId(postId);
        List<String> mediaUrls = mediaMapper.findUrlsByTarget("POST", postId);

        return PostResponse.from(post, nickname, profileImageUrl, isLiked, isBookmarked, hashtags, mediaUrls);
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
            String actorName = userMapper.findNicknameById(userId);
            NotificationEvent event = NotificationEvent.builder()
                    .eventType("LIKE")
                    .targetUserId(post.getUserId())
                    .actorId(userId)
                    .actorName(actorName)
                    .targetId(postId)
                    .targetType("POST")
                    .preview(actorName + "님이 게시글을 좋아합니다.")
                    .createdAt(java.time.LocalDateTime.now())
                    .build();
            Runnable publish = () -> {
                try {
                    notificationPublisher.publish(event);
                } catch (Exception e) {
                    log.warn("좋아요 알림 발행 실패: postId={}, userId={}", postId, userId, e);
                }
            };
            if (TransactionSynchronizationManager.isSynchronizationActive()) {
                TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                    @Override public void afterCommit() { publish.run(); }
                });
            } else {
                publish.run();
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

    @Override
    @Transactional(readOnly = true)
    public FeedResponse getUserPosts(Long viewerId, Long targetUserId, Long cursor, int size) {

        // 미니홈피 자체의 공개범위(access_level)를 먼저 체크 — 개별 글의 visibility보다 우선
        minihompyService.checkAccessPermission(targetUserId, viewerId);

        List<Post> posts = postMapper.findByUserId(targetUserId, viewerId, cursor, size + 1);

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

        // 작성자별 프로필 사진 맵
        Map<Long, String> profileImageMap = mediaMapper.findAllByTargets("PROFILE", userIds).stream()
                .collect(Collectors.toMap(Media::getTargetId, Media::getMediaUrl, (a, b) -> a));

        java.util.Set<Long> likedPostIds = (viewerId != null)
                ? postLikeMapper.findLikedPostIds(viewerId, postIds)
                : java.util.Set.of();
        java.util.Set<Long> bookmarkedPostIds = (viewerId != null)
                ? bookmarkMapper.findBookmarkedPostIds(viewerId, postIds)
                : java.util.Set.of();

        return posts.stream()
                .map(post -> PostResponse.from(post,
                        nicknameMap.getOrDefault(post.getUserId(), ""),
                        profileImageMap.get(post.getUserId()),
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

    private void publishPostCreatedNotifications(Post post, String actorName) {
        if ("PRIVATE".equals(post.getVisibility())) {
            return;
        }

        List<Long> friendUserIds = friendMapper.findAcceptedFriendUserIds(post.getUserId());
        if (friendUserIds.isEmpty()) {
            return;
        }

        List<NotificationEvent> events = friendUserIds.stream()
                .map(friendUserId -> NotificationEvent.builder()
                        .eventType("POST_CREATED")
                        .targetUserId(friendUserId)
                        .actorId(post.getUserId())
                        .actorName(actorName)
                        .targetId(post.getPostId())
                        .targetType("POST")
                        .preview(actorName + "님이 다이어리를 작성했습니다.")
                        .createdAt(LocalDateTime.now())
                        .build())
                .toList();

        Runnable publish = () -> {
            try {
                events.forEach(notificationPublisher::publish);
            } catch (Exception e) {
                log.warn("게시글 작성 알림 발행 실패: postId={}, userId={}", post.getPostId(), post.getUserId(), e);
            }
        };

        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    publish.run();
                }
            });
            return;
        }

        publish.run();
    }
}
