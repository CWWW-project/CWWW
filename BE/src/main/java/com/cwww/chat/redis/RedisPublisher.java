package com.cwww.chat.redis;

import com.cwww.chat.dto.response.ChatMessageResponse;
import com.cwww.chat.dto.response.ChatListUpdateResponse;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.cwww.global.exception.BusinessException;
import com.cwww.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class RedisPublisher {
    private final RedisTemplate<String, String> redisTemplate;
    @Qualifier("chatMessageTopic")
    private final ChannelTopic chatMessageTopic;
    @Qualifier("chatListTopic")
    private final ChannelTopic chatListTopic;
    private final ObjectMapper objectMapper;

    public void publishMessage(ChatMessageResponse message) {
        try {
            String payload = objectMapper.writeValueAsString(message);
            redisTemplate.convertAndSend(chatMessageTopic.getTopic(), payload);
        } catch (JsonProcessingException e) {
            throw new BusinessException(ErrorCode.REDIS_PUBLISH_FAILED);
        }
    }

    public void publishChatList(ChatListUpdateResponse chatListUpdate) {
        try {
            String payload = objectMapper.writeValueAsString(chatListUpdate);
            redisTemplate.convertAndSend(chatListTopic.getTopic(), payload);
        } catch (JsonProcessingException e) {
            throw new BusinessException(ErrorCode.REDIS_PUBLISH_FAILED);
        }
    }
}
