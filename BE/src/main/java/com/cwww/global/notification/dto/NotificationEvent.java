package com.cwww.global.notification.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class NotificationEvent {
    private String eventType;
    private Long targetUserId;
    private Long actorId;
    private String actorName;
    private Long targetId;
    private String targetType;
    private String preview;
    private LocalDateTime createdAt;
}
