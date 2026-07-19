package com.cwww.chat.dto.response;

import com.cwww.chat.domain.ChatMessage;
import com.cwww.chat.domain.MessageType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

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
    private List<String> mediaUrls;

    public static ChatMessageResponse from(ChatMessage chatMessage,
                                           Integer unreadMemberCount,
                                           String eventType,
                                           List<String> mediaUrls) {
        return ChatMessageResponse.builder()
                .eventType(eventType)
                .messageId(chatMessage.getMessageId())
                .chatId(chatMessage.getChatId())
                .senderId(chatMessage.getSenderId())
                .content(chatMessage.getContent())
                .messageType(chatMessage.getMessageType())
                .createdAt(chatMessage.getCreatedAt())
                .unreadMemberCount(unreadMemberCount)
                .mediaUrls(mediaUrls == null ? Collections.emptyList() : mediaUrls)
                .build();
    }
}
