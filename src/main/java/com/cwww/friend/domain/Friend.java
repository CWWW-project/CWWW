package com.cwww.friend.domain;

import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class Friend {

    private Long friendId;
    private Long requesterId;
    private Long receiverId;
    private String status;          // PENDING / ACCEPTED / REJECTED
    private String requesterAlias;
    private String receiverAlias;
    private LocalDateTime createdAt;
    private LocalDateTime acceptedAt;
    private LocalDateTime terminatedAt;
}
