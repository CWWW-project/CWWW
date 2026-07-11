package com.cwww.friend.dto.response;

import com.cwww.friend.domain.Friend;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class FriendResponse {

    private Long friendId;
    private Long requesterId;
    private Long receiverId;
    private String status;
    private String requesterAlias;
    private String receiverAlias;
    private LocalDateTime createdAt;
    private LocalDateTime acceptedAt;

    public static FriendResponse from(Friend friend) {
        return FriendResponse.builder()
                .friendId(friend.getFriendId())
                .requesterId(friend.getRequesterId())
                .receiverId(friend.getReceiverId())
                .status(friend.getStatus())
                .requesterAlias(friend.getRequesterAlias())
                .receiverAlias(friend.getReceiverAlias())
                .createdAt(friend.getCreatedAt())
                .acceptedAt(friend.getAcceptedAt())
                .build();
    }
}
