package com.cwww.chat.dto.response;

import com.cwww.chat.domain.ChatMessage;
import com.cwww.chat.domain.MessageType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ChatMessageResponse {
    private String eventType;
    private Long messageId;
    private Long chatId;
    private Long senderId;
    private String content;
    private MessageType messageType;
    private LocalDateTime createdAt;
    private Integer unreadMemberCount;

    public static ChatMessageResponse from(ChatMessage chatMessage, Integer unreadMemberCount) {
        return from(chatMessage, unreadMemberCount, "MESSAGE");
    }

    public static ChatMessageResponse from(ChatMessage chatMessage,
                                           Integer unreadMemberCount,
                                           String eventType) {
        return ChatMessageResponse.builder()
                .eventType(eventType)
                .messageId(chatMessage.getMessageId())
                .chatId(chatMessage.getChatId())
                .senderId(chatMessage.getSenderId())
                .content(chatMessage.getContent())
                .messageType(chatMessage.getMessageType())
                .createdAt(chatMessage.getCreatedAt())
                .unreadMemberCount(unreadMemberCount)
                .build();
    }
}
