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
import com.cwww.post.domain.Media;
import com.cwww.post.mapper.MediaMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatMessageService {
    private static final String CHAT_MESSAGE_TARGET_TYPE = "CHAT_MESSAGE";

    @Value("${storage.local.base-url:http://localhost:8080/uploads}")
    private String storageBaseUrl;

    private final ChatRoomMapper chatRoomMapper;
    private final ChatParticipantMapper chatParticipantMapper;
    private final ChatMessageMapper chatMessageMapper;
    private final MediaMapper mediaMapper;

    // 새 메시지를 저장하고 첨부 URL을 media 테이블에 연결한 뒤 실시간 응답으로 반환한다.
    @Transactional
    public ChatMessageResponse sendMessage(Long senderId, ChatMessageRequest request) {
        ChatRoom chatRoom = validateChatRoom(request.getChatId());
        validateSender(chatRoom.getChatId(), senderId);
        List<String> mediaUrls = normalizeMediaUrls(request);
        validateMessageContent(request, mediaUrls);

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
        saveMediaUrls(chatMessage.getMessageId(), mediaUrls);

        int unreadMemberCount = countUnreadParticipants(chatMessage);
        return ChatMessageResponse.from(chatMessage, unreadMemberCount, "MESSAGE", mediaUrls);
    }

    // 본인이 보낸 메시지를 소프트 삭제하고 채팅방의 마지막 메시지 포인터를 다시 맞춘다.
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

    // 최신 메시지 목록을 기본 조건으로 조회한다.
    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getMessages(Long userId, Long chatId) {
        return getMessages(userId, chatId, null);
    }

    // 기준 메시지 이전의 히스토리를 페이지 단위로 조회한다.
    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getMessages(Long userId, Long chatId, Long beforeMessageId) {
        return getMessagesByEventType(userId, chatId, beforeMessageId, "MESSAGE");
    }

    // 읽음 상태 동기화용 eventType으로 메시지 목록을 다시 구성한다.
    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getMessagesForReadSync(Long userId, Long chatId) {
        return getMessagesByEventType(userId, chatId, null, "READ_SYNC");
    }

    // eventType만 바꿔가며 공통 메시지 조회와 응답 조립을 수행한다.
    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getMessagesByEventType(Long userId,
                                                             Long chatId,
                                                             Long beforeMessageId,
                                                             String eventType) {
        ChatRoom chatRoom = validateChatRoom(chatId);
        validateSender(chatRoom.getChatId(), userId);
        List<ChatMessage> messages = chatMessageMapper.findByChatIdOrderByCreatedAtAsc(
                chatRoom.getChatId(),
                beforeMessageId
        );
        List<ChatMessageResponse> responses = new ArrayList<>();

        for (ChatMessage message : messages) {
            int unreadMemberCount = countUnreadParticipants(message);
            List<String> mediaUrls = mediaMapper.findUrlsByTarget(
                    CHAT_MESSAGE_TARGET_TYPE,
                    message.getMessageId()
            );
            ChatMessageResponse response = ChatMessageResponse.from(
                    message,
                    unreadMemberCount,
                    eventType,
                    mediaUrls
            );
            responses.add(response);
        }

        return responses;
    }

    // 요청 대상 채팅방이 실제로 존재하는지 검증한다.
    private ChatRoom validateChatRoom(Long chatId) {
        ChatRoom chatRoom = chatRoomMapper.findById(chatId);
        if (chatRoom == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND);
        }
        return chatRoom;
    }

    // 요청 사용자가 해당 채팅방의 참여자인지 검증한다.
    private void validateSender(Long chatId, Long senderId) {
        ChatParticipant participant = chatParticipantMapper.findByChatIdAndUserId(chatId, senderId);
        if (participant == null) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
    }

    // 메시지 타입별로 본문이 충족해야 하는 최소 조건을 검증한다.
    private void validateMessageContent(ChatMessageRequest request, List<String> mediaUrls) {
        if (request.getMessageType() == null) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }

        if (request.getMessageType() == MessageType.TEXT) {
            String content = request.getContent();
            if (content == null || content.isBlank()) {
                throw new BusinessException(ErrorCode.INVALID_INPUT);
            }
            return;
        }

        if ((request.getMessageType() == MessageType.IMAGE || request.getMessageType() == MessageType.FILE)
                && mediaUrls.isEmpty()) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
    }

    // 텍스트 본문을 저장 전 공백 기준으로 정리한다.
    private String normalizeContent(ChatMessageRequest request) {
        if (request.getContent() == null) {
            return null;
        }
        return request.getContent().trim();
    }

    // 첨부 URL 목록이 없으면 빈 리스트로 정규화한다.
    private List<String> normalizeMediaUrls(ChatMessageRequest request) {
        if (request.getMediaUrls() == null) {
            return Collections.emptyList();
        }

        List<String> normalizedMediaUrls = new ArrayList<>();
        for (String mediaUrl : request.getMediaUrls()) {
            if (mediaUrl == null || mediaUrl.isBlank()) {
                continue;
            }

            String normalizedMediaUrl = mediaUrl.trim();
            if (!isAllowedStorageUrl(normalizedMediaUrl)) {
                throw new BusinessException(ErrorCode.INVALID_INPUT);
            }

            normalizedMediaUrls.add(normalizedMediaUrl);
        }

        return normalizedMediaUrls;
    }

    private boolean isAllowedStorageUrl(String mediaUrl) {
        String allowedBaseUrl = storageBaseUrl;
        while (allowedBaseUrl.endsWith("/")) {
            allowedBaseUrl = allowedBaseUrl.substring(0, allowedBaseUrl.length() - 1);
        }

        return mediaUrl.startsWith(allowedBaseUrl + "/");
    }

    // 첨부 URL들을 CHAT_MESSAGE 대상으로 media 테이블에 저장한다.
    private void saveMediaUrls(Long messageId, List<String> mediaUrls) {
        if (mediaUrls == null || mediaUrls.isEmpty()) {
            return;
        }

        for (String mediaUrl : mediaUrls) {
            Media media = Media.builder()
                    .targetType(CHAT_MESSAGE_TARGET_TYPE)
                    .targetId(messageId)
                    .mediaUrl(mediaUrl)
                    .build();
            mediaMapper.insert(media);
        }
    }

    // 특정 메시지를 아직 읽지 않은 다른 참여자 수를 계산한다.
    private int countUnreadParticipants(ChatMessage chatMessage) {
        return chatMessageMapper.countUnreadParticipants(
                chatMessage.getChatId(),
                chatMessage.getMessageId(),
                chatMessage.getSenderId()
        );
    }
}
