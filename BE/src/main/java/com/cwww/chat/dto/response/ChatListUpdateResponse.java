package com.cwww.chat.dto.response;

import com.cwww.chat.domain.ChatRoomType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ChatListUpdateResponse {
    private Long userId;
    private Long chatId;
    private ChatRoomType type;
    private String roomName;
    private String lastMessage;
    private LocalDateTime lastMessageCreatedAt;
    private Integer unreadCount;

    public static ChatListUpdateResponse from(Long userId,
                                              Long chatId,
                                              ChatRoomType type,
                                              String roomName,
                                              String lastMessage,
                                              LocalDateTime lastMessageCreatedAt,
                                              Integer unreadCount) {
        return ChatListUpdateResponse.builder()
                .userId(userId)
                .chatId(chatId)
                .type(type)
                .roomName(roomName)
                .lastMessage(lastMessage)
                .lastMessageCreatedAt(lastMessageCreatedAt)
                .unreadCount(unreadCount)
                .build();
    }
}
