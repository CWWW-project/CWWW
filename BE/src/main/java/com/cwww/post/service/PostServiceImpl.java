package com.cwww.post.service;

import com.cwww.friend.mapper.FriendMapper;
import com.cwww.global.exception.BusinessException;
import com.cwww.global.exception.ErrorCode;
import com.cwww.post.domain.Hashtag;
import com.cwww.post.domain.Media;
import com.cwww.post.domain.Post;
import com.cwww.post.dto.FeedResponse;
import com.cwww.post.dto.PostCreateRequest;
import com.cwww.post.dto.PostResponse;
import com.cwww.post.dto.PostUpdateRequest;
import com.cwww.post.mapper.HashtagMapper;
import com.cwww.post.mapper.MediaMapper;
import com.cwww.post.mapper.PostLikeMapper;
import com.cwww.post.mapper.PostMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PostServiceImpl implements PostService {

    private final PostMapper postMapper;
    private final MediaMapper mediaMapper;
    private final HashtagMapper hashtagMapper;
    private final FriendMapper friendMapper;
    private final PostLikeMapper postLikeMapper;

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

        return PostResponse.from(post, request.getHashtags(), request.getMediaUrls());
    }

    @Override
    @Transactional(readOnly = true)
    public PostResponse getPost(Long viewerId, Long postId) {
        Post post = postMapper.findById(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));

        checkVisibility(viewerId, post);

        List<String> hashtags = hashtagMapper.findNamesByPostId(postId);
        List<String> mediaUrls = mediaMapper.findUrlsByTarget("POST", postId);

        return PostResponse.from(post, hashtags, mediaUrls);
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
        List<Post> posts = postMapper.findFeed(viewerId, cursor, size);

        boolean hasNext = posts.size() > size;
        if (hasNext) {
            posts = posts.subList(0, size);
        }

        Long nextCursor = hasNext ? posts.get(posts.size() - 1).getPostId() : null;

        List<PostResponse> responses = posts.stream()
                .map(post -> PostResponse.from(post, List.of(), List.of()))
                .toList();

        return FeedResponse.builder()
                .posts(responses)
                .nextCursor(nextCursor)
                .hasNext(hasNext)
                .build();
    }

    @Override
    @Transactional
    public void likePost(Long userId, Long postId) {
        postMapper.findById(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));

        if (postLikeMapper.exists(postId, userId)) {
            throw new BusinessException(ErrorCode.ALREADY_LIKED);
        }

        postLikeMapper.insert(postId, userId);
        postMapper.incrementLikeCount(postId);
    }

    @Override
    @Transactional
    public void unlikePost(Long userId, Long postId) {
        postMapper.findById(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));

        if (!postLikeMapper.exists(postId, userId)) {
            throw new BusinessException(ErrorCode.NOT_LIKED);
        }

        postLikeMapper.delete(postId, userId);
        postMapper.decrementLikeCount(postId);
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
