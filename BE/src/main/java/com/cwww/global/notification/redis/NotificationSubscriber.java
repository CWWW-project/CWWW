package com.cwww.global.notification.redis;

import com.cwww.global.exception.BusinessException;
import com.cwww.global.exception.ErrorCode;
import com.cwww.global.notification.dto.NotificationEvent;
import com.cwww.global.notification.dto.NotificationResponse;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class NotificationSubscriber {
    private final ObjectMapper objectMapper;
    private final SimpMessagingTemplate simpMessagingTemplate;

    public void onMessage(String message) {
        try {
            NotificationEvent event = objectMapper.readValue(message, NotificationEvent.class);
            NotificationResponse response = NotificationResponse.from(event);

            simpMessagingTemplate.convertAndSend(
                    "/sub/notifications/" + response.getUserId(),
                    response
            );
        } catch (JsonProcessingException e) {
            throw new BusinessException(ErrorCode.REDIS_SUBSCRIBE_FAILED);
        }
    }
}
