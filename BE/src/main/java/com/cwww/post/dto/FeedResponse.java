package com.cwww.post.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class FeedResponse {

    private List<PostResponse> posts;
    private Long nextCursor;
    private boolean hasNext;
}
