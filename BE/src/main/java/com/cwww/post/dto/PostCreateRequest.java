package com.cwww.post.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Getter
@NoArgsConstructor
public class PostCreateRequest {

    @NotBlank
    private String title;

    @NotBlank
    private String content;

    @Pattern(regexp = "ALL|FRIEND|PRIVATE", message = "공개범위는 ALL, FRIEND, PRIVATE 중 하나여야 합니다.")
    private String visibility = "ALL";

    private Long minihompyId;

    private List<String> hashtags = new ArrayList<>();
    private List<String> mediaUrls = new ArrayList<>();

    public void setTitle(String title) { this.title = title; }
    public void setContent(String content) { this.content = content; }
    public void setVisibility(String visibility) { this.visibility = visibility; }
    public void setMinihompyId(Long minihompyId) { this.minihompyId = minihompyId; }
    public void setHashtags(List<String> hashtags) { this.hashtags = hashtags != null ? hashtags : new ArrayList<>(); }
    public void setMediaUrls(List<String> mediaUrls) { this.mediaUrls = mediaUrls != null ? mediaUrls : new ArrayList<>(); }
}
