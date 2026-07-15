package com.cwww.chat.controller;

import com.cwww.chat.dto.request.ChatMessageRequest;
import com.cwww.chat.dto.response.ChatListUpdateResponse;
import com.cwww.chat.dto.response.ChatMessageResponse;
import com.cwww.chat.domain.ChatParticipant;
import com.cwww.chat.domain.ChatRoom;
import com.cwww.chat.mapper.ChatParticipantMapper;
import com.cwww.chat.mapper.ChatRoomMapper;
import com.cwww.chat.redis.RedisPublisher;
import com.cwww.chat.service.ChatMessageService;
import com.cwww.chat.service.ChatRoomService;
import com.cwww.global.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.List;

@Controller
@RequiredArgsConstructor
public class ChatMessageController {
    private final ChatMessageService chatMessageService;
    private final ChatRoomService chatRoomService;
    private final ChatRoomMapper chatRoomMapper;
    private final ChatParticipantMapper chatParticipantMapper;
    private final RedisPublisher redisPublisher;


    @MessageMapping("/chat/message")
    public void sendMessage(@Header("X-User-Id") Long senderId,
                            @Valid ChatMessageRequest request) {
        ChatMessageResponse savedMessage = chatMessageService.sendMessage(senderId, request);
        redisPublisher.publishMessage(savedMessage);

        ChatRoom room = chatRoomMapper.findById(savedMessage.getChatId());
        List<ChatParticipant> participants = chatParticipantMapper.findByChatId(savedMessage.getChatId());
        List<Long> participantUserIds = new java.util.ArrayList<>();

        for (ChatParticipant participant : participants) {
            participantUserIds.add(participant.getUserId());
        }

        List<ChatListUpdateResponse> chatListUpdates = chatRoomService.createChatListUpdateResponses(
                participantUserIds,
                room.getChatId()
        );

        for (ChatListUpdateResponse chatListUpdate : chatListUpdates) {
            redisPublisher.publishChatList(chatListUpdate);
        }
    }

    @GetMapping("/api/chat/rooms/{chatId}/messages")
    @ResponseBody
    public ResponseEntity<ApiResponse<List<ChatMessageResponse>>>
    getMessages(@RequestHeader("X-User-Id") Long userId,
                @PathVariable Long chatId,
                @RequestParam(required = false) Long beforeMessageId) {
        List<ChatMessageResponse> response = chatMessageService.getMessages(userId, chatId, beforeMessageId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/api/chat/rooms/{chatId}/messages/{messageId}/delete")
    @ResponseBody
    public ResponseEntity<ApiResponse<Void>>
    deleteMessage(@RequestHeader("X-User-Id") Long userId,
                  @PathVariable Long chatId,
                  @PathVariable Long messageId) {
        chatMessageService.deleteMessage(userId, chatId, messageId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
