package com.cwww.post.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class PostUpdateRequest {

    @NotBlank
    private String title;

    @NotBlank
    private String content;

    @NotBlank
    @Pattern(regexp = "ALL|FRIEND|PRIVATE", message = "공개범위는 ALL, FRIEND, PRIVATE 중 하나여야 합니다.")
    private String visibility;

    @Size(max = 30, message = "해시태그는 최대 30개까지 입력 가능합니다.")
    private List<@Size(max = 50, message = "해시태그는 최대 50자까지 입력 가능합니다.") String> hashtags = new ArrayList<>();

    public void setHashtags(List<String> hashtags) { this.hashtags = hashtags != null ? hashtags : new ArrayList<>(); }
}
