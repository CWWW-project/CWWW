package com.cwww.chat.redis;

import com.cwww.chat.dto.response.ChatMessageResponse;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.cwww.global.exception.BusinessException;
import com.cwww.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ChatMessageSubscriber {
    private final ObjectMapper objectMapper;
    private final SimpMessagingTemplate simpMessagingTemplate;

    public void onMessage(String message) {
        try {
            ChatMessageResponse chatMessage = objectMapper.readValue(message, ChatMessageResponse.class);
            simpMessagingTemplate.convertAndSend("/sub/chat/room/" + chatMessage.getChatId(), chatMessage);
        } catch (JsonProcessingException e) {
            throw new BusinessException(ErrorCode.REDIS_SUBSCRIBE_FAILED);
        }
    }
}
