package com.cwww.chat.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ChatParticipantResponse {
    private Long userId;
    private String nickname;

    public static ChatParticipantResponse from(Long userId, String nickname) {
        return ChatParticipantResponse.builder()
                .userId(userId)
                .nickname(nickname)
                .build();
    }
}
