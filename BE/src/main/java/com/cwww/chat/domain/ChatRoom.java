package com.cwww.chat.domain;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatRoom {
    private Long chatId;
    private ChatRoomType type;
    private String name;
    private Long lastMessageId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
