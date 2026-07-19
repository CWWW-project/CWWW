package com.cwww.global.notification.dto;

import com.cwww.chat.dto.response.ChatMessageResponse;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class NotificationResponse {
    private String notificationId;
    private String eventType;
    private Long userId;
    private Long actorId;
    private String actorName;
    private Long targetId;
    private String targetType;
    private String preview;
    private LocalDateTime createdAt;

    public static NotificationResponse from(NotificationEvent event) {
        return NotificationResponse.builder()
                .notificationId(buildNotificationId(event))
                .eventType(event.getEventType())
                .userId(event.getTargetUserId())
                .actorId(event.getActorId())
                .actorName(event.getActorName())
                .targetId(event.getTargetId())
                .targetType(event.getTargetType())
                .preview(event.getPreview())
                .createdAt(event.getCreatedAt())
                .build();
    }

    public static NotificationResponse from(Long userId,
                                            ChatMessageResponse chatMessage,
                                            String actorName,
                                            String preview) {
        return NotificationResponse.builder()
                .notificationId("chat-" + chatMessage.getMessageId())
                .eventType("CHAT_NOTIFICATION")
                .userId(userId)
                .actorId(chatMessage.getSenderId())
                .actorName(actorName)
                .targetId(chatMessage.getChatId())
                .targetType("CHAT_ROOM")
                .preview(preview)
                .createdAt(chatMessage.getCreatedAt())
                .build();
    }

    private static String buildNotificationId(NotificationEvent event) {
        String createdAtKey = event.getCreatedAt() == null ? "unknown" : event.getCreatedAt().toString();
        return event.getEventType()
                + "-" + event.getTargetUserId()
                + "-" + event.getTargetType()
                + "-" + event.getTargetId()
                + "-" + event.getActorId()
                + "-" + createdAtKey;
    }
}
