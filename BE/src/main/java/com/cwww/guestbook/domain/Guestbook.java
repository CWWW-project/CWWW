package com.cwww.guestbook.domain;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Guestbook {

    private Long guestbookId;
    private Long minihompyId;
    private Long writerId;
    private String content;
    private boolean secret;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;

}
