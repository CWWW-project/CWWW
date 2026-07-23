package com.cwww.chat.domain;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatParticipant {
    private Long participantId;
    private Long chatId;
    private Long userId;
    private Long lastReadMessageId;
    private Boolean isAlarm;
    private LocalDateTime leftAt;
}
