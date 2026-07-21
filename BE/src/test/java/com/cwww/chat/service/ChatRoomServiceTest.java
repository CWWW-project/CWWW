package com.cwww.chat.service;

import com.cwww.chat.domain.ChatParticipant;
import com.cwww.chat.domain.ChatRoom;
import com.cwww.chat.domain.ChatRoomType;
import com.cwww.chat.dto.request.CreateChatRoomRequest;
import com.cwww.chat.dto.response.ChatRoomResponse;
import com.cwww.chat.dto.response.CreateChatRoomResponse;
import com.cwww.chat.mapper.ChatParticipantMapper;
import com.cwww.chat.mapper.ChatRoomMapper;
import com.cwww.friend.domain.Friend;
import com.cwww.friend.mapper.FriendMapper;
import com.cwww.global.exception.BusinessException;
import com.cwww.global.exception.ErrorCode;
import com.cwww.user.mapper.UserMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class ChatRoomServiceTest {

    @Mock private ChatRoomMapper chatRoomMapper;
    @Mock private ChatParticipantMapper chatParticipantMapper;
    @Mock private UserMapper userMapper;
    @Mock private FriendMapper friendMapper;

    @InjectMocks
    private ChatRoomService chatRoomService;

    @Test
    @DisplayName("채팅방 생성 성공 - 참여자 목록까지 함께 저장")
    void createChatRoom_success() {
        // Arrange
        CreateChatRoomRequest request = CreateChatRoomRequest.builder()
                .type(ChatRoomType.GROUP)
                .name("백엔드 단톡방")
                .participantUserIds(List.of(1L, 2L, 3L))
                .build();

        doAnswer(invocation -> {
            ChatRoom chatRoom = invocation.getArgument(0);
            chatRoom.setChatId(10L);
            return null;
        }).when(chatRoomMapper).insert(any(ChatRoom.class));

        // Act
        CreateChatRoomResponse response = chatRoomService.createChatRoom(1L, request);

        // Assert
        assertThat(response.getChatId()).isEqualTo(10L);
        assertThat(response.getType()).isEqualTo(ChatRoomType.GROUP);
        assertThat(response.getName()).isEqualTo("백엔드 단톡방");
        assertThat(response.getDisplayName()).isEqualTo("백엔드 단톡방");

        verify(chatRoomMapper).insert(any(ChatRoom.class));
        verify(chatParticipantMapper, times(3)).insert(any(ChatParticipant.class));

        ArgumentCaptor<ChatParticipant> captor = ArgumentCaptor.forClass(ChatParticipant.class);
        verify(chatParticipantMapper, times(3)).insert(captor.capture());

        List<ChatParticipant> participants = captor.getAllValues();
        assertThat(participants)
                .extracting(ChatParticipant::getChatId)
                .containsOnly(10L);
        assertThat(participants)
                .extracting(ChatParticipant::getUserId)
                .containsExactly(1L, 2L, 3L);
    }

    @Test
    @DisplayName("채팅방 생성 실패 - 그룹 채팅방은 이름이 필수")
    void createChatRoom_groupWithoutName_fail() {
        // Arrange
        CreateChatRoomRequest request = CreateChatRoomRequest.builder()
                .type(ChatRoomType.GROUP)
                .name("   ")
                .participantUserIds(List.of(1L, 2L))
                .build();

        // Act & Assert
        assertInvalidRequest(request);
    }

    @Test
    @DisplayName("채팅방 생성 성공 - 개인 채팅방은 이름 없이 생성 가능")
    void createChatRoom_privateWithoutName_success() {
        // Arrange
        CreateChatRoomRequest request = CreateChatRoomRequest.builder()
                .type(ChatRoomType.PRIVATE)
                .name("   ")
                .participantUserIds(List.of(1L, 2L))
                .build();

        doAnswer(invocation -> {
            ChatRoom chatRoom = invocation.getArgument(0);
            chatRoom.setChatId(20L);
            return null;
        }).when(chatRoomMapper).insert(any(ChatRoom.class));
        org.mockito.BDDMockito.given(userMapper.findNicknameById(2L)).willReturn("장수호");

        // Act
        CreateChatRoomResponse response = chatRoomService.createChatRoom(1L, request);

        // Assert
        assertThat(response.getChatId()).isEqualTo(20L);
        assertThat(response.getType()).isEqualTo(ChatRoomType.PRIVATE);
        assertThat(response.getName()).isNull();
        assertThat(response.getDisplayName()).isEqualTo("장수호");

        verify(chatRoomMapper).insert(any(ChatRoom.class));
        verify(chatParticipantMapper, times(2)).insert(any(ChatParticipant.class));
    }

    @Test
    @DisplayName("채팅방 생성 성공 - 개인 채팅방 표시 이름은 일촌 별칭을 우선 사용")
    void createChatRoom_privateWithFriendAlias_success() {
        // Arrange
        CreateChatRoomRequest request = CreateChatRoomRequest.builder()
                .type(ChatRoomType.PRIVATE)
                .name(null)
                .participantUserIds(List.of(1L, 2L))
                .build();
        Friend friend = Friend.builder()
                .requesterId(1L)
                .receiverId(2L)
                .status("ACCEPTED")
                .requesterAlias("내 일촌명")
                .receiverAlias("상대 일촌명")
                .build();

        doAnswer(invocation -> {
            ChatRoom chatRoom = invocation.getArgument(0);
            chatRoom.setChatId(21L);
            return null;
        }).when(chatRoomMapper).insert(any(ChatRoom.class));
        org.mockito.BDDMockito.given(friendMapper.findActiveByUsers(1L, 2L))
                .willReturn(java.util.Optional.of(friend));

        // Act
        CreateChatRoomResponse response = chatRoomService.createChatRoom(1L, request);

        // Assert
        assertThat(response.getDisplayName()).isEqualTo("내 일촌명");
    }

    @Test
    @DisplayName("채팅방 생성 실패 - 이미 1:1 채팅방이 존재")
    void createChatRoom_privateAlreadyExists_fail() {
        // Arrange
        CreateChatRoomRequest request = CreateChatRoomRequest.builder()
                .type(ChatRoomType.PRIVATE)
                .name(null)
                .participantUserIds(List.of(1L, 2L))
                .build();
        ChatRoom existingRoom = ChatRoom.builder()
                .chatId(30L)
                .type(ChatRoomType.PRIVATE)
                .build();
        org.mockito.BDDMockito.given(chatRoomMapper.findActivePrivateRoomByUserIds(1L, 2L))
                .willReturn(existingRoom);

        // Act & Assert
        assertThatThrownBy(() -> chatRoomService.createChatRoom(1L, request))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.PRIVATE_CHAT_ROOM_ALREADY_EXISTS);

        verify(chatRoomMapper, never()).insert(any(ChatRoom.class));
        verify(chatParticipantMapper, never()).insert(any(ChatParticipant.class));
    }

    @Test
    @DisplayName("채팅방 생성 실패 - 개인 채팅방은 참여자가 정확히 2명이어야 함")
    void createChatRoom_privateWithInvalidParticipantCount_fail() {
        // Arrange
        CreateChatRoomRequest request = CreateChatRoomRequest.builder()
                .type(ChatRoomType.PRIVATE)
                .name(null)
                .participantUserIds(List.of(1L))
                .build();

        // Act & Assert
        assertInvalidRequest(request);
    }

    @Test
    @DisplayName("채팅방 생성 실패 - 그룹 채팅방은 참여자가 최소 2명이어야 함")
    void createChatRoom_groupWithInvalidParticipantCount_fail() {
        // Arrange
        CreateChatRoomRequest request = CreateChatRoomRequest.builder()
                .type(ChatRoomType.GROUP)
                .name("백엔드 단톡방")
                .participantUserIds(List.of(1L))
                .build();

        // Act & Assert
        assertInvalidRequest(request);
    }

    @Test
    @DisplayName("채팅방 생성 실패 - 개인 채팅방은 참여자 중복이 불가능")
    void createChatRoom_privateWithDuplicateParticipants_fail() {
        // Arrange
        CreateChatRoomRequest request = CreateChatRoomRequest.builder()
                .type(ChatRoomType.PRIVATE)
                .name(null)
                .participantUserIds(List.of(1L, 1L))
                .build();

        // Act & Assert
        assertInvalidRequest(request);
    }

    @Test
    @DisplayName("채팅방 생성 실패 - 그룹 채팅방은 참여자 중복이 불가능")
    void createChatRoom_groupWithDuplicateParticipants_fail() {
        // Arrange
        CreateChatRoomRequest request = CreateChatRoomRequest.builder()
                .type(ChatRoomType.GROUP)
                .name("백엔드 단톡방")
                .participantUserIds(List.of(1L, 2L, 2L))
                .build();

        // Act & Assert
        assertInvalidRequest(request);
    }

    //잘못된 생성 요청 공통 검증
    private void assertInvalidRequest(CreateChatRoomRequest request) {
        assertThatThrownBy(() -> chatRoomService.createChatRoom(1L, request))
                .isInstanceOf(BusinessException.class);

        verify(chatRoomMapper, never()).insert(any(ChatRoom.class));
        verify(chatParticipantMapper, never()).insert(any(ChatParticipant.class));
    }
}
