package com.cwww.global.notification.redis;

import com.cwww.global.exception.BusinessException;
import com.cwww.global.exception.ErrorCode;
import com.cwww.global.notification.dto.NotificationEvent;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class RedisNotificationPublisher{
    private final RedisTemplate<String, String> redisTemplate;
    @Qualifier("notificationTopic")
    private final ChannelTopic notificationTopic;
    private final ObjectMapper objectMapper;

    public void publish(NotificationEvent event) {
        try {
            String payload = objectMapper.writeValueAsString(event);
            redisTemplate.convertAndSend(notificationTopic.getTopic(), payload);
        } catch (JsonProcessingException e) {
            throw new BusinessException(ErrorCode.REDIS_PUBLISH_FAILED);
        }
    }
}
