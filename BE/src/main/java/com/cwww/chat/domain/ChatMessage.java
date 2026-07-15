package com.cwww.chat.domain;


import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessage {
    private Long messageId;
    private Long chatId;
    private Long senderId;
    private MessageType messageType;
    private String content;
    private Boolean isDeleted;
    private LocalDateTime createdAt;
}