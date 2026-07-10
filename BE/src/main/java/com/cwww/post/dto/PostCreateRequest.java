package com.cwww.post.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class PostCreateRequest {

    @NotBlank
    private String title;

    @NotBlank
    private String content;

    @Pattern(regexp = "ALL|FRIEND|PRIVATE", message = "공개범위는 ALL, FRIEND, PRIVATE 중 하나여야 합니다.")
    private String visibility = "ALL";

    private List<String> hashtags = new ArrayList<>();
    private List<String> mediaUrls = new ArrayList<>();
}
