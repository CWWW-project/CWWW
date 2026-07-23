package com.cwww.chat.controller;

import com.cwww.chat.dto.request.CreateChatRoomRequest;
import com.cwww.chat.dto.request.InviteParticipantsRequest;
import com.cwww.chat.dto.response.ChatListUpdateResponse;
import com.cwww.chat.dto.response.ChatMessageResponse;
import com.cwww.chat.dto.response.ChatParticipantResponse;
import com.cwww.chat.dto.response.ChatRoomResponse;
import com.cwww.chat.dto.response.CreateChatRoomResponse;
import com.cwww.chat.redis.RedisPublisher;
import com.cwww.chat.service.ChatMessageService;
import com.cwww.chat.service.ChatRoomService;
import com.cwww.global.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/chat/rooms")
@RequiredArgsConstructor
public class ChatRoomController {

    private final ChatRoomService chatRoomService;
    private final ChatMessageService chatMessageService;
    private final RedisPublisher redisPublisher;

    @PostMapping
    public ResponseEntity<ApiResponse<CreateChatRoomResponse>>
    createChatRoom(Authentication authentication,
                   @Valid @RequestBody CreateChatRoomRequest request) {
        Long userId = (Long) authentication.getPrincipal();
        CreateChatRoomResponse response = chatRoomService.createChatRoom(userId, request);

        List<ChatListUpdateResponse> chatListUpdateResponses = chatRoomService.createChatListUpdateResponses(
                request.getParticipantUserIds(),
                response.getChatId()
        );

        for (ChatListUpdateResponse chatListUpdateResponse : chatListUpdateResponses) {
            redisPublisher.publishChatList(chatListUpdateResponse);
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ChatRoomResponse>>>
    getChatRooms(Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        List<ChatRoomResponse> response = chatRoomService.getChatRooms(userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{chatId}/participants")
    public ResponseEntity<ApiResponse<List<ChatParticipantResponse>>>
    getActiveParticipants(Authentication authentication,
                          @PathVariable Long chatId) {
        Long userId = (Long) authentication.getPrincipal();
        List<ChatParticipantResponse> response = chatRoomService.getActiveParticipants(userId, chatId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/{chatId}/read")
    public ResponseEntity<ApiResponse<ChatListUpdateResponse>>
    markAsRead(Authentication authentication,
               @PathVariable Long chatId) {
        Long userId = (Long) authentication.getPrincipal();
        ChatListUpdateResponse response = chatRoomService.markAsRead(userId, chatId);
        List<ChatMessageResponse> messages = chatMessageService.getMessagesForReadSync(userId, chatId);

        for (ChatMessageResponse message : messages) {
            redisPublisher.publishMessage(message);
        }

        redisPublisher.publishChatList(response);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/{chatId}/leave")
    public ResponseEntity<ApiResponse<Void>>
    leaveChatRoom(Authentication authentication,
                  @PathVariable Long chatId) {
        Long userId = (Long) authentication.getPrincipal();
        ChatMessageResponse systemMessage = chatRoomService.leaveChatRoom(userId, chatId);
        redisPublisher.publishMessage(systemMessage);

        List<Long> activeUserIds = chatRoomService.getActiveParticipantUserIds(chatId);
        List<ChatListUpdateResponse> chatListUpdateResponses = chatRoomService.createChatListUpdateResponses(
                activeUserIds,
                chatId
        );

        for (ChatListUpdateResponse chatListUpdateResponse : chatListUpdateResponses) {
            redisPublisher.publishChatList(chatListUpdateResponse);
        }

        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/{chatId}/participants")
    public ResponseEntity<ApiResponse<Void>>
    inviteParticipants(Authentication authentication,
                       @PathVariable Long chatId,
                       @Valid @RequestBody InviteParticipantsRequest request) {
        Long userId = (Long) authentication.getPrincipal();
        List<ChatMessageResponse> systemMessages = chatRoomService.inviteParticipants(userId, chatId, request);

        for (ChatMessageResponse systemMessage : systemMessages) {
            redisPublisher.publishMessage(systemMessage);
        }

        List<Long> activeUserIds = chatRoomService.getActiveParticipantUserIds(chatId);
        List<ChatListUpdateResponse> chatListUpdateResponses = chatRoomService.createChatListUpdateResponses(
                activeUserIds,
                chatId
        );

        for (ChatListUpdateResponse chatListUpdateResponse : chatListUpdateResponses) {
            redisPublisher.publishChatList(chatListUpdateResponse);
        }

        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
