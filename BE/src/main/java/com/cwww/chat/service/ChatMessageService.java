package com.cwww.chat.service;

import com.cwww.chat.domain.ChatMessage;
import com.cwww.chat.domain.ChatParticipant;
import com.cwww.chat.domain.ChatRoom;
import com.cwww.chat.domain.MessageType;
import com.cwww.chat.dto.request.ChatMessageRequest;
import com.cwww.chat.dto.response.ChatMessageResponse;
import com.cwww.chat.mapper.ChatParticipantMapper;
import com.cwww.chat.mapper.ChatMessageMapper;
import com.cwww.chat.mapper.ChatRoomMapper;
import com.cwww.global.exception.BusinessException;
import com.cwww.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatMessageService {
    private final ChatRoomMapper chatRoomMapper;
    private final ChatParticipantMapper chatParticipantMapper;
    private final ChatMessageMapper chatMessageMapper;

    @Transactional
    public ChatMessageResponse sendMessage(Long senderId, ChatMessageRequest request) {
        ChatRoom chatRoom = validateChatRoom(request.getChatId());
        validateSender(chatRoom.getChatId(), senderId);
        validateMessageContent(request);

        ChatMessage chatMessage = ChatMessage.builder()
                .chatId(chatRoom.getChatId())
                .senderId(senderId)
                .messageType(request.getMessageType())
                .content(normalizeContent(request))
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .build();

        chatMessageMapper.insert(chatMessage);
        chatRoomMapper.updateLastMessage(chatRoom.getChatId(), chatMessage.getMessageId());

        int unreadMemberCount = countUnreadParticipants(chatMessage);
        return ChatMessageResponse.from(chatMessage, unreadMemberCount);
    }

    @Transactional
    public void deleteMessage(Long userId, Long chatId, Long messageId) {
        ChatRoom chatRoom = validateChatRoom(chatId);
        validateSender(chatRoom.getChatId(), userId);

        ChatMessage chatMessage = chatMessageMapper.findById(messageId);
        if (chatMessage == null || !chatMessage.getChatId().equals(chatId)) {
            throw new BusinessException(ErrorCode.NOT_FOUND);
        }

        if (!chatMessage.getSenderId().equals(userId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        chatMessageMapper.softDelete(messageId);

        ChatMessage latestVisibleMessage = chatMessageMapper.findLatestVisibleByChatId(chatId);
        Long lastMessageId = null;

        if (latestVisibleMessage != null) {
            lastMessageId = latestVisibleMessage.getMessageId();
        }

        chatRoomMapper.updateLastMessageForDelete(chatId, lastMessageId);
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getMessages(Long userId, Long chatId) {
        return getMessages(userId, chatId, null);
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getMessages(Long userId, Long chatId, Long beforeMessageId) {
        return getMessagesByEventType(userId, chatId, beforeMessageId, "MESSAGE");
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getMessagesForReadSync(Long userId, Long chatId) {
        return getMessagesByEventType(userId, chatId, null, "READ_SYNC");
    }

    @Transactional(readOnly = true)
    private List<ChatMessageResponse> getMessagesByEventType(Long userId,
                                                             Long chatId,
                                                             Long beforeMessageId,
                                                             String eventType) {
        ChatRoom chatRoom = validateChatRoom(chatId);
        validateSender(chatRoom.getChatId(), userId);
        List<ChatMessage> messages = chatMessageMapper.findByChatIdOrderByCreatedAtAsc(
                chatRoom.getChatId(),
                beforeMessageId
        );
        List<ChatMessageResponse> responses = new java.util.ArrayList<>();

        for (ChatMessage message : messages) {
            int unreadMemberCount = countUnreadParticipants(message);
            ChatMessageResponse response = ChatMessageResponse.from(message, unreadMemberCount, eventType);
            responses.add(response);
        }

        return responses;
    }

    //메시지 전송 대상 채팅방 제약
    private ChatRoom validateChatRoom(Long chatId) {
        ChatRoom chatRoom = chatRoomMapper.findById(chatId);
        if (chatRoom == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND);
        }
        return chatRoom;
    }

    //메시지 발신자 참여 여부 제약
    private void validateSender(Long chatId, Long senderId) {
        ChatParticipant participant = chatParticipantMapper.findByChatIdAndUserId(chatId, senderId);
        if (participant == null) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
    }

    //메시지 타입별 내용 제약
    private void validateMessageContent(ChatMessageRequest request) {
        if (request.getMessageType() == null) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }

        if (request.getMessageType() == MessageType.TEXT) {
            String content = request.getContent();
            if (content == null || content.isBlank()) {
                throw new BusinessException(ErrorCode.INVALID_INPUT);
            }
        }
    }

    //메시지 타입별 내용 정규화
    private String normalizeContent(ChatMessageRequest request) {
        if (request.getContent() == null) {
            return null;
        }
        return request.getContent().trim();
    }

    //메시지별 안읽은 참여자 수 계산
    private int countUnreadParticipants(ChatMessage chatMessage) {
        return chatMessageMapper.countUnreadParticipants(
                chatMessage.getChatId(),
                chatMessage.getMessageId(),
                chatMessage.getSenderId()
        );
    }
}
