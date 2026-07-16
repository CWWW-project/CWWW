package com.cwww.chat.redis;

import com.cwww.chat.domain.ChatParticipant;
import com.cwww.chat.domain.ChatRoom;
import com.cwww.chat.dto.response.ChatMessageResponse;
import com.cwww.chat.mapper.ChatParticipantMapper;
import com.cwww.chat.mapper.ChatRoomMapper;
import com.cwww.global.exception.BusinessException;
import com.cwww.global.exception.ErrorCode;
import com.cwww.global.notification.dto.NotificationResponse;
import com.cwww.user.mapper.UserMapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class ChatNotificationSubscriber {
    private final ObjectMapper objectMapper;
    private final SimpMessagingTemplate simpMessagingTemplate;
    private final ChatParticipantMapper chatParticipantMapper;
    private final ChatRoomMapper chatRoomMapper;
    private final UserMapper userMapper;

    public void onMessage(String message) {
        try {
            ChatMessageResponse chatMessage = objectMapper.readValue(message, ChatMessageResponse.class);

            if (!"MESSAGE".equals(chatMessage.getEventType())) {
                return;
            }

            List<ChatParticipant> participants = chatParticipantMapper.findByChatId(chatMessage.getChatId());
            String actorName = buildActorName(chatMessage);
            String preview = buildPreview(chatMessage);

            for (ChatParticipant participant : participants) {
                if (participant.getUserId().equals(chatMessage.getSenderId())) {
                    continue;
                }

                NotificationResponse notification = NotificationResponse.from(
                        participant.getUserId(),
                        chatMessage,
                        actorName,
                        preview
                );

                simpMessagingTemplate.convertAndSend(
                        "/sub/notifications/" + participant.getUserId(),
                        notification
                );
            }
        } catch (JsonProcessingException e) {
            throw new BusinessException(ErrorCode.REDIS_SUBSCRIBE_FAILED);
        }
    }

    private String buildPreview(ChatMessageResponse chatMessage) {
        if (chatMessage.getMessageType() == null) {
            return "";
        }

        return switch (chatMessage.getMessageType()) {
            case IMAGE -> "사진을 보냈습니다.";
            case FILE -> "파일을 보냈습니다.";
            case SYSTEM -> chatMessage.getContent();
            case TEXT -> chatMessage.getContent();
        };
    }

    private String buildActorName(ChatMessageResponse chatMessage) {
        ChatRoom chatRoom = chatRoomMapper.findById(chatMessage.getChatId());
        String roomName = chatRoom != null && chatRoom.getName() != null && !chatRoom.getName().isBlank()
                ? chatRoom.getName()
                : "";
        String senderNickname = userMapper.findNicknameById(chatMessage.getSenderId());
        return roomName + " · " + senderNickname;
    }
}
