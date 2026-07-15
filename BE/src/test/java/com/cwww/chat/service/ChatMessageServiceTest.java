package com.cwww.chat.service;

import com.cwww.chat.domain.ChatMessage;
import com.cwww.chat.domain.ChatParticipant;
import com.cwww.chat.domain.ChatRoom;
import com.cwww.chat.domain.ChatRoomType;
import com.cwww.chat.domain.MessageType;
import com.cwww.chat.dto.request.ChatMessageRequest;
import com.cwww.chat.dto.response.ChatMessageResponse;
import com.cwww.chat.mapper.ChatMessageMapper;
import com.cwww.chat.mapper.ChatParticipantMapper;
import com.cwww.chat.mapper.ChatRoomMapper;
import com.cwww.global.exception.BusinessException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class ChatMessageServiceTest {

    @Mock private ChatRoomMapper chatRoomMapper;
    @Mock private ChatParticipantMapper chatParticipantMapper;
    @Mock private ChatMessageMapper chatMessageMapper;

    @InjectMocks
    private ChatMessageService chatMessageService;

    @Test
    @DisplayName("메시지 전송 성공 - 채팅 메시지 저장 후 마지막 메시지 갱신")
    void sendMessage_success() {
        // Arrange
        Long senderId = 1L;
        ChatMessageRequest request = new ChatMessageRequest();
        request.setChatId(10L);
        request.setMessageType(MessageType.TEXT);
        request.setContent("안녕하세요");

        given(chatRoomMapper.findById(10L))
                .willReturn(ChatRoom.builder().chatId(10L).type(ChatRoomType.PRIVATE).build());
        given(chatParticipantMapper.findByChatIdAndUserId(10L, senderId))
                .willReturn(ChatParticipant.builder().chatId(10L).userId(senderId).build());
        doAnswer(invocation -> {
            ChatMessage chatMessage = invocation.getArgument(0);
            chatMessage.setMessageId(100L);
            return null;
        }).when(chatMessageMapper).insert(any(ChatMessage.class));
        given(chatMessageMapper.countUnreadParticipants(10L, 100L, senderId)).willReturn(1);

        // Act
        ChatMessageResponse response = chatMessageService.sendMessage(senderId, request);

        // Assert
        assertThat(response.getMessageId()).isEqualTo(100L);
        assertThat(response.getChatId()).isEqualTo(10L);
        assertThat(response.getSenderId()).isEqualTo(senderId);
        assertThat(response.getMessageType()).isEqualTo(MessageType.TEXT);
        assertThat(response.getContent()).isEqualTo("안녕하세요");
        assertThat(response.getCreatedAt()).isNotNull();
        assertThat(response.getUnreadMemberCount()).isEqualTo(1);

        verify(chatMessageMapper).insert(any(ChatMessage.class));
        verify(chatRoomMapper).updateLastMessage(10L, 100L);
    }

    @Test
    @DisplayName("메시지 전송 실패 - 존재하지 않는 채팅방")
    void sendMessage_roomNotFound_fail() {
        // Arrange
        ChatMessageRequest request = new ChatMessageRequest();
        request.setChatId(99L);
        request.setMessageType(MessageType.TEXT);
        request.setContent("안녕하세요");

        given(chatRoomMapper.findById(99L)).willReturn(null);

        // Act & Assert
        assertThatThrownBy(() -> chatMessageService.sendMessage(1L, request))
                .isInstanceOf(BusinessException.class);

        verify(chatParticipantMapper, never()).findByChatIdAndUserId(any(), any());
        verify(chatMessageMapper, never()).insert(any(ChatMessage.class));
    }

    @Test
    @DisplayName("메시지 전송 실패 - 채팅방 참여자가 아님")
    void sendMessage_notParticipant_fail() {
        // Arrange
        Long senderId = 3L;
        ChatMessageRequest request = new ChatMessageRequest();
        request.setChatId(10L);
        request.setMessageType(MessageType.TEXT);
        request.setContent("안녕하세요");

        given(chatRoomMapper.findById(10L))
                .willReturn(ChatRoom.builder().chatId(10L).type(ChatRoomType.GROUP).build());
        given(chatParticipantMapper.findByChatIdAndUserId(10L, senderId)).willReturn(null);

        // Act & Assert
        assertThatThrownBy(() -> chatMessageService.sendMessage(senderId, request))
                .isInstanceOf(BusinessException.class);

        verify(chatMessageMapper, never()).insert(any(ChatMessage.class));
        verify(chatRoomMapper, never()).updateLastMessage(any(), any());
    }

    @Test
    @DisplayName("메시지 전송 실패 - 텍스트 메시지는 내용이 필수")
    void sendMessage_blankText_fail() {
        // Arrange
        Long senderId = 1L;
        ChatMessageRequest request = new ChatMessageRequest();
        request.setChatId(10L);
        request.setMessageType(MessageType.TEXT);
        request.setContent("   ");

        given(chatRoomMapper.findById(10L))
                .willReturn(ChatRoom.builder().chatId(10L).type(ChatRoomType.PRIVATE).build());
        given(chatParticipantMapper.findByChatIdAndUserId(10L, senderId))
                .willReturn(ChatParticipant.builder().chatId(10L).userId(senderId).build());

        // Act & Assert
        assertThatThrownBy(() -> chatMessageService.sendMessage(senderId, request))
                .isInstanceOf(BusinessException.class);

        verify(chatMessageMapper, never()).insert(any(ChatMessage.class));
        verify(chatRoomMapper, never()).updateLastMessage(any(), any());
    }

    @Test
    @DisplayName("메시지 조회 성공 - 채팅방 참여자는 대화 내역을 조회할 수 있다")
    void getMessages_success() {
        // Arrange
        Long userId = 1L;
        Long chatId = 10L;

        given(chatRoomMapper.findById(chatId))
                .willReturn(ChatRoom.builder().chatId(chatId).type(ChatRoomType.GROUP).build());
        given(chatParticipantMapper.findByChatIdAndUserId(chatId, userId))
                .willReturn(ChatParticipant.builder().chatId(chatId).userId(userId).build());
        given(chatMessageMapper.findByChatIdOrderByCreatedAtAsc(chatId, null))
                .willReturn(List.of(
                        ChatMessage.builder()
                                .messageId(1L)
                                .chatId(chatId)
                                .senderId(1L)
                                .messageType(MessageType.TEXT)
                                .content("첫 메시지")
                                .createdAt(LocalDateTime.now().minusMinutes(1))
                                .build(),
                        ChatMessage.builder()
                                .messageId(2L)
                                .chatId(chatId)
                                .senderId(2L)
                                .messageType(MessageType.TEXT)
                                .content("두 번째 메시지")
                                .createdAt(LocalDateTime.now())
                                .build()
                ));
        given(chatMessageMapper.countUnreadParticipants(chatId, 1L, 1L)).willReturn(1);
        given(chatMessageMapper.countUnreadParticipants(chatId, 2L, 2L)).willReturn(0);

        // Act
        List<ChatMessageResponse> response = chatMessageService.getMessages(userId, chatId);

        // Assert
        assertThat(response).hasSize(2);
        assertThat(response.get(0).getMessageId()).isEqualTo(1L);
        assertThat(response.get(0).getContent()).isEqualTo("첫 메시지");
        assertThat(response.get(0).getUnreadMemberCount()).isEqualTo(1);
        assertThat(response.get(1).getMessageId()).isEqualTo(2L);
        assertThat(response.get(1).getContent()).isEqualTo("두 번째 메시지");
        assertThat(response.get(1).getUnreadMemberCount()).isEqualTo(0);
    }

    @Test
    @DisplayName("메시지 조회 실패 - 채팅방 참여자가 아니면 조회할 수 없다")
    void getMessages_notParticipant_fail() {
        // Arrange
        Long userId = 3L;
        Long chatId = 10L;

        given(chatRoomMapper.findById(chatId))
                .willReturn(ChatRoom.builder().chatId(chatId).type(ChatRoomType.GROUP).build());
        given(chatParticipantMapper.findByChatIdAndUserId(chatId, userId)).willReturn(null);

        // Act & Assert
        assertThatThrownBy(() -> chatMessageService.getMessages(userId, chatId))
                .isInstanceOf(BusinessException.class);

        verify(chatMessageMapper, never()).findByChatIdOrderByCreatedAtAsc(any(), any());
    }
}
