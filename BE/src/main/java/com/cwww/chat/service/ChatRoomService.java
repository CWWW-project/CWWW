package com.cwww.chat.service;

import com.cwww.chat.domain.ChatMessage;
import com.cwww.chat.domain.ChatParticipant;
import com.cwww.chat.domain.ChatRoom;
import com.cwww.chat.domain.ChatRoomType;
import com.cwww.chat.domain.MessageType;
import com.cwww.chat.dto.request.CreateChatRoomRequest;
import com.cwww.chat.dto.request.InviteParticipantsRequest;
import com.cwww.chat.dto.response.ChatListUpdateResponse;
import com.cwww.chat.dto.response.ChatMessageResponse;
import com.cwww.chat.dto.response.ChatParticipantResponse;
import com.cwww.chat.dto.response.ChatRoomResponse;
import com.cwww.chat.dto.response.CreateChatRoomResponse;
import com.cwww.chat.mapper.ChatMessageMapper;
import com.cwww.chat.mapper.ChatParticipantMapper;
import com.cwww.chat.mapper.ChatRoomMapper;
import com.cwww.global.exception.BusinessException;
import com.cwww.global.exception.ErrorCode;
import com.cwww.user.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ChatRoomService {
    private final ChatRoomMapper chatRoomMapper;
    private final ChatParticipantMapper chatParticipantMapper;
    private final ChatMessageMapper chatMessageMapper;
    private final UserMapper userMapper;

    @Transactional
    public CreateChatRoomResponse createChatRoom(Long userId, CreateChatRoomRequest request) {
        validateParticipants(request);
        String roomName = normalizeRoomName(request);

        ChatRoom chatRoom = ChatRoom.builder()
                .type(request.getType())
                .name(roomName)
                .build();

        chatRoomMapper.insert(chatRoom);

        for (Long participantUserId : request.getParticipantUserIds()) {
            ChatParticipant participant = ChatParticipant.builder()
                    .chatId(chatRoom.getChatId())
                    .userId(participantUserId)
                    .build();
            chatParticipantMapper.insert(participant);
        }

        String displayName = resolveCreateDisplayName(userId, request, chatRoom);
        return CreateChatRoomResponse.from(chatRoom, displayName);
    }

    @Transactional(readOnly = true)
    public List<ChatRoomResponse> getChatRooms(Long userId) {
        List<ChatParticipant> participants = chatParticipantMapper.findByUserId(userId);
        List<ChatRoom> rooms = new ArrayList<>();
        List<ChatParticipant> matchedParticipants = new ArrayList<>();

        for (ChatParticipant participant : participants) {
            ChatRoom chatRoom = chatRoomMapper.findById(participant.getChatId());
            if (chatRoom != null) {
                rooms.add(chatRoom);
                matchedParticipants.add(participant);
            }
        }

        for (int i = 0; i < rooms.size() - 1; i++) {
            for (int j = i + 1; j < rooms.size(); j++) {
                LocalDateTime firstSortTime = getRoomSortTime(rooms.get(i));
                LocalDateTime secondSortTime = getRoomSortTime(rooms.get(j));

                if (shouldSwapRoomOrder(firstSortTime, secondSortTime)) {
                    ChatRoom firstRoom = rooms.get(i);
                    rooms.set(i, rooms.get(j));
                    rooms.set(j, firstRoom);

                    ChatParticipant firstParticipant = matchedParticipants.get(i);
                    matchedParticipants.set(i, matchedParticipants.get(j));
                    matchedParticipants.set(j, firstParticipant);
                }
            }
        }

        List<ChatRoomResponse> responses = new ArrayList<>();
        for (int i = 0; i < rooms.size(); i++) {
            ChatRoom room = rooms.get(i);
            ChatParticipant participant = matchedParticipants.get(i);
            ChatMessage lastMessage = findLastMessage(room.getChatId());
            String lastMessageContent = null;
            LocalDateTime lastMessageCreatedAt = null;

            if (lastMessage != null) {
                lastMessageContent = lastMessage.getContent();
                lastMessageCreatedAt = lastMessage.getCreatedAt();
            }

            int unreadCount = chatMessageMapper.countUnreadMessages(
                    room.getChatId(),
                    participant.getLastReadMessageId(),
                    userId
            );
            String displayName = resolveRoomDisplayName(userId, room);

            ChatRoomResponse response = ChatRoomResponse.from(
                    room,
                    displayName,
                    lastMessageContent,
                    lastMessageCreatedAt,
                    unreadCount
            );
            responses.add(response);
        }

        return responses;
    }

    @Transactional
    public ChatListUpdateResponse markAsRead(Long userId, Long chatId) {
        validateChatRoom(chatId);
        validateParticipant(chatId, userId);
        ChatMessage lastMessage = findLastMessage(chatId);
        Long lastReadMessageId = null;

        if (lastMessage != null) {
            lastReadMessageId = lastMessage.getMessageId();
        }

        chatParticipantMapper.updateLastReadMessageId(chatId, userId, lastReadMessageId);
        return createChatListUpdateResponse(userId, chatId);
    }

    @Transactional
    public ChatMessageResponse leaveChatRoom(Long userId, Long chatId) {
        validateChatRoom(chatId);
        ChatParticipant participant = validateParticipant(chatId, userId);

        if (participant.getLeftAt() != null) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }

        String nickname = findNickname(userId);
        chatParticipantMapper.updateLeftAt(chatId, userId);

        return saveSystemMessage(
                userId,
                chatId,
                nickname + "님이 채팅방을 나갔습니다."
        );
    }

    @Transactional
    public List<ChatMessageResponse> inviteParticipants(Long userId,
                                                        Long chatId,
                                                        InviteParticipantsRequest request) {
        ChatRoom chatRoom = validateChatRoom(chatId);
        validateParticipant(chatId, userId);

        if (chatRoom.getType() != ChatRoomType.GROUP) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }

        validateInviteParticipants(userId, request);

        String inviterNickname = findNickname(userId);
        List<ChatMessageResponse> responses = new ArrayList<>();

        for (Long invitedUserId : request.getParticipantUserIds()) {
            ChatParticipant existingParticipant = chatParticipantMapper.findAnyByChatIdAndUserId(chatId, invitedUserId);

            if (existingParticipant == null) {
                ChatParticipant participant = ChatParticipant.builder()
                        .chatId(chatId)
                        .userId(invitedUserId)
                        .build();
                chatParticipantMapper.insert(participant);
            } else if (existingParticipant.getLeftAt() != null) {
                chatParticipantMapper.reactivateParticipant(chatId, invitedUserId);
            } else {
                throw new BusinessException(ErrorCode.INVALID_INPUT);
            }

            String invitedNickname = findNickname(invitedUserId);
            ChatMessageResponse response = saveSystemMessage(
                    userId,
                    chatId,
                    inviterNickname + "님이 " + invitedNickname + "님을 초대했습니다."
            );
            responses.add(response);
        }

        return responses;
    }

    @Transactional(readOnly = true)
    public ChatListUpdateResponse createChatListUpdateResponse(Long userId, Long chatId) {
        ChatRoom chatRoom = validateChatRoom(chatId);
        ChatParticipant participant = validateParticipant(chatId, userId);
        ChatMessage lastMessage = findLastMessage(chatId);
        String lastMessageContent = null;
        LocalDateTime lastMessageCreatedAt = null;

        if (lastMessage != null) {
            lastMessageContent = lastMessage.getContent();
            lastMessageCreatedAt = lastMessage.getCreatedAt();
        }

        int unreadCount = chatMessageMapper.countUnreadMessages(
                chatRoom.getChatId(),
                participant.getLastReadMessageId(),
                userId
        );
        String displayName = resolveRoomDisplayName(userId, chatRoom);

        return ChatListUpdateResponse.from(
                userId,
                chatRoom.getChatId(),
                chatRoom.getType(),
                displayName,
                lastMessageContent,
                lastMessageCreatedAt,
                unreadCount
        );
    }

    @Transactional(readOnly = true)
    public List<Long> getActiveParticipantUserIds(Long chatId) {
        List<ChatParticipant> participants = chatParticipantMapper.findByChatId(chatId);
        List<Long> userIds = new ArrayList<>();

        for (ChatParticipant participant : participants) {
            userIds.add(participant.getUserId());
        }

        return userIds;
    }

    @Transactional(readOnly = true)
    public List<ChatListUpdateResponse> createChatListUpdateResponses(List<Long> userIds, Long chatId) {
        List<ChatListUpdateResponse> responses = new ArrayList<>();
        Set<Long> activeUserIds = new HashSet<>(getActiveParticipantUserIds(chatId));

        for (Long userId : userIds) {
            if (!activeUserIds.contains(userId)) {
                continue;
            }

            ChatListUpdateResponse response = createChatListUpdateResponse(userId, chatId);
            responses.add(response);
        }

        return responses;
    }

    @Transactional(readOnly = true)
    public List<ChatParticipantResponse> getActiveParticipants(Long userId, Long chatId) {
        ChatRoom chatRoom = validateChatRoom(chatId);
        validateParticipant(chatId, userId);

        List<ChatParticipant> participants = chatParticipantMapper.findByChatId(chatRoom.getChatId());
        List<ChatParticipantResponse> responses = new ArrayList<>();

        for (ChatParticipant participant : participants) {
            if (participant.getLeftAt() != null) {
                continue;
            }

            responses.add(ChatParticipantResponse.from(
                    participant.getUserId(),
                    findNickname(participant.getUserId())
            ));
        }

        return responses;
    }

    private void validateParticipants(CreateChatRoomRequest request) {
        List<Long> participantUserIds = request.getParticipantUserIds();

        if (hasDuplicateParticipant(participantUserIds)) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }

        if (request.getType() == ChatRoomType.PRIVATE && participantUserIds.size() != 2) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }

        if (request.getType() == ChatRoomType.GROUP && participantUserIds.size() < 2) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
    }

    private void validateInviteParticipants(Long userId, InviteParticipantsRequest request) {
        List<Long> participantUserIds = request.getParticipantUserIds();

        if (hasDuplicateParticipant(participantUserIds)) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }

        for (Long participantUserId : participantUserIds) {
            if (participantUserId.equals(userId)) {
                throw new BusinessException(ErrorCode.INVALID_INPUT);
            }
        }
    }

    private boolean hasDuplicateParticipant(List<Long> participantUserIds) {
        Set<Long> uniqueParticipantIds = new HashSet<>(participantUserIds);
        return uniqueParticipantIds.size() != participantUserIds.size();
    }

    private String normalizeRoomName(CreateChatRoomRequest request) {
        String name = request.getName();

        if (request.getType() == ChatRoomType.GROUP) {
            if (isBlank(name)) {
                throw new BusinessException(ErrorCode.INVALID_INPUT);
            }
            return name.trim();
        }

        if (isBlank(name)) {
            return null;
        }
        return name.trim();
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private ChatRoom validateChatRoom(Long chatId) {
        ChatRoom chatRoom = chatRoomMapper.findById(chatId);
        if (chatRoom == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND);
        }
        return chatRoom;
    }

    private ChatParticipant validateParticipant(Long chatId, Long userId) {
        ChatParticipant participant = chatParticipantMapper.findByChatIdAndUserId(chatId, userId);
        if (participant == null) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        if (participant.getLeftAt() != null) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        return participant;
    }

    private LocalDateTime getRoomSortTime(ChatRoom chatRoom) {
        return chatRoom.getUpdatedAt() != null ? chatRoom.getUpdatedAt() : chatRoom.getCreatedAt();
    }

    private boolean shouldSwapRoomOrder(LocalDateTime firstSortTime, LocalDateTime secondSortTime) {
        if (firstSortTime == null && secondSortTime == null) {
            return false;
        }

        if (firstSortTime == null) {
            return true;
        }

        if (secondSortTime == null) {
            return false;
        }

        return secondSortTime.isAfter(firstSortTime);
    }

    private ChatMessage findLastMessage(Long chatId) {
        ChatRoom chatRoom = validateChatRoom(chatId);

        if (chatRoom.getLastMessageId() == null) {
            return null;
        }
        return chatMessageMapper.findById(chatRoom.getLastMessageId());
    }

    private ChatMessageResponse saveSystemMessage(Long senderId, Long chatId, String content) {
        ChatMessage chatMessage = ChatMessage.builder()
                .chatId(chatId)
                .senderId(senderId)
                .messageType(MessageType.SYSTEM)
                .content(content)
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .build();

        chatMessageMapper.insert(chatMessage);
        chatRoomMapper.updateLastMessage(chatId, chatMessage.getMessageId());

        int unreadMemberCount = chatMessageMapper.countUnreadParticipants(
                chatMessage.getChatId(),
                chatMessage.getMessageId(),
                chatMessage.getSenderId()
        );

        return ChatMessageResponse.from(chatMessage, unreadMemberCount, "MESSAGE", Collections.emptyList());
    }

    private String resolveCreateDisplayName(Long userId,
                                            CreateChatRoomRequest request,
                                            ChatRoom chatRoom) {
        if (chatRoom.getType() == ChatRoomType.GROUP) {
            return chatRoom.getName();
        }

        Long opponentUserId = findOpponentUserIdFromRequest(userId, request.getParticipantUserIds());
        return findNickname(opponentUserId);
    }

    private String resolveRoomDisplayName(Long userId, ChatRoom chatRoom) {
        if (chatRoom.getType() == ChatRoomType.GROUP) {
            return chatRoom.getName();
        }

        List<ChatParticipant> participants = chatParticipantMapper.findByChatId(chatRoom.getChatId());
        Long opponentUserId = findOpponentUserIdFromParticipants(userId, participants);

        if (opponentUserId == null) {
            return "알 수 없음";
        }

        return findNickname(opponentUserId);
    }

    private Long findOpponentUserIdFromRequest(Long userId, List<Long> participantUserIds) {
        for (Long participantUserId : participantUserIds) {
            if (!participantUserId.equals(userId)) {
                return participantUserId;
            }
        }

        throw new BusinessException(ErrorCode.INVALID_INPUT);
    }

    private Long findOpponentUserIdFromParticipants(Long userId, List<ChatParticipant> participants) {
        for (ChatParticipant participant : participants) {
            if (!participant.getUserId().equals(userId)) {
                return participant.getUserId();
            }
        }

        return null;
    }

    private String findNickname(Long userId) {
        String nickname = userMapper.findNicknameById(userId);

        if (nickname == null || nickname.isBlank()) {
            throw new BusinessException(ErrorCode.NOT_FOUND);
        }

        return nickname;
    }
}
