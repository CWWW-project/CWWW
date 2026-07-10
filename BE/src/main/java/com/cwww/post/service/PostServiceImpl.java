package com.cwww.post.service;

import com.cwww.post.domain.Hashtag;
import com.cwww.post.domain.Media;
import com.cwww.post.domain.Post;
import com.cwww.post.dto.PostCreateRequest;
import com.cwww.post.dto.PostResponse;
import com.cwww.post.mapper.HashtagMapper;
import com.cwww.post.mapper.MediaMapper;
import com.cwww.post.mapper.PostMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PostServiceImpl implements PostService {

    private final PostMapper postMapper;
    private final MediaMapper mediaMapper;
    private final HashtagMapper hashtagMapper;

    @Override
    @Transactional
    public PostResponse createPost(Long userId, PostCreateRequest request) {
        Post post = Post.builder()
                .userId(userId)
                .title(request.getTitle())
                .content(request.getContent())
                .visibility(request.getVisibility())
                .build();

        postMapper.insert(post);

        saveHashtags(post.getPostId(), request.getHashtags());
        saveMediaUrls(post.getPostId(), request.getMediaUrls());

        return PostResponse.from(post, request.getHashtags(), request.getMediaUrls());
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
