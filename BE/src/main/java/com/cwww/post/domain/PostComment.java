package com.cwww.post.domain;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostComment {

    private Long commentId;
    private Long postId;
    private Long userId;
    private String nickname;
    private Long parentCommentId;
    private String content;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
