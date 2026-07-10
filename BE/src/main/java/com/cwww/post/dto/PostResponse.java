package com.cwww.post.dto;

import com.cwww.post.domain.Post;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class PostResponse {

    private Long postId;
    private Long userId;
    private Long minihompyId;
    private String title;
    private String content;
    private String visibility;
    private int viewCount;
    private int likeCount;
    private int commentCount;
    private List<String> hashtags;
    private List<String> mediaUrls;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static PostResponse from(Post post, List<String> hashtags, List<String> mediaUrls) {
        return PostResponse.builder()
                .postId(post.getPostId())
                .userId(post.getUserId())
                .minihompyId(post.getMinihompyId())
                .title(post.getTitle())
                .content(post.getContent())
                .visibility(post.getVisibility())
                .viewCount(post.getViewCount())
                .likeCount(post.getLikeCount())
                .commentCount(post.getCommentCount())
                .hashtags(hashtags)
                .mediaUrls(mediaUrls)
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .build();
    }
}
