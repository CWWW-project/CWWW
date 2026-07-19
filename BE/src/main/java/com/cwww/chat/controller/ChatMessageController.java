package com.cwww.chat.controller;

import com.cwww.chat.dto.request.ChatMessageRequest;
import com.cwww.chat.dto.response.ChatListUpdateResponse;
import com.cwww.chat.dto.response.ChatMessageResponse;
import com.cwww.chat.redis.RedisPublisher;
import com.cwww.chat.service.ChatMessageService;
import com.cwww.chat.service.ChatRoomService;
import com.cwww.global.response.ApiResponse;
import com.cwww.global.storage.StorageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.ArrayList;
import java.util.List;

@Controller
@RequiredArgsConstructor
public class ChatMessageController {
    private final ChatMessageService chatMessageService;
    private final ChatRoomService chatRoomService;
    private final RedisPublisher redisPublisher;
    private final StorageService storageService;


    @MessageMapping("/chat/message")
    public void sendMessage(Principal principal,
                            @Valid ChatMessageRequest request) {
        if (principal == null) {
            throw new IllegalArgumentException("Unauthenticated websocket session");
        }

        Long senderId = Long.valueOf(principal.getName());
        ChatMessageResponse savedMessage = chatMessageService.sendMessage(senderId, request);
        redisPublisher.publishMessage(savedMessage);

        List<Long> participantUserIds = chatRoomService.getActiveParticipantUserIds(savedMessage.getChatId());

        List<ChatListUpdateResponse> chatListUpdates = chatRoomService.createChatListUpdateResponses(
                participantUserIds,
                savedMessage.getChatId()
        );

        for (ChatListUpdateResponse chatListUpdate : chatListUpdates) {
            redisPublisher.publishChatList(chatListUpdate);
        }
    }

    @GetMapping("/api/chat/rooms/{chatId}/messages")
    @ResponseBody
    public ResponseEntity<ApiResponse<List<ChatMessageResponse>>>
    getMessages(Authentication authentication,
                @PathVariable Long chatId,
                @RequestParam(required = false) Long beforeMessageId) {
        Long userId = (Long) authentication.getPrincipal();
        List<ChatMessageResponse> response = chatMessageService.getMessages(userId, chatId, beforeMessageId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/api/chat/rooms/{chatId}/messages/{messageId}/delete")
    @ResponseBody
    public ResponseEntity<ApiResponse<Void>>
    deleteMessage(Authentication authentication,
                  @PathVariable Long chatId,
                  @PathVariable Long messageId) {
        Long userId = (Long) authentication.getPrincipal();
        chatMessageService.deleteMessage(userId, chatId, messageId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/api/chat/media/upload")
    @ResponseBody
    public ResponseEntity<ApiResponse<List<String>>> uploadChatMedia(
            @RequestParam("files") List<MultipartFile> files) {
        List<String> mediaUrls = new ArrayList<>();
        for(MultipartFile file: files ){
            String mediaUrl = storageService.store(file);
            mediaUrls.add(mediaUrl);
        }

        return ResponseEntity.ok(ApiResponse.success(mediaUrls));
    }
}
