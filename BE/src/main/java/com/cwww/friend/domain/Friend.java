package com.cwww.friend.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
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
