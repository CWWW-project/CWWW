package com.cwww.friend.service;

import com.cwww.friend.domain.Friend;
import com.cwww.friend.dto.response.FriendResponse;
import com.cwww.friend.mapper.FriendMapper;
import com.cwww.global.exception.BusinessException;
import com.cwww.global.exception.ErrorCode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class FriendServiceTest {

    @Mock private FriendMapper friendMapper;

    @InjectMocks
    private FriendServiceImpl friendService;

    // ── 일촌 신청 ──────────────────────────────────────────

    @Test
    @DisplayName("일촌 신청 성공")
    void sendRequest_success() {
        // Arrange
        Long requesterId = 1L;
        Long receiverId = 2L;
        given(friendMapper.findActiveByUsers(requesterId, receiverId)).willReturn(Optional.empty());
        given(friendMapper.insert(any(Friend.class))).willReturn(1);

        // Act
        friendService.sendRequest(requesterId, receiverId);

        // Assert
        verify(friendMapper).insert(any(Friend.class));
    }

    @Test
    @DisplayName("일촌 신청 실패 - 자기 자신에게 신청")
    void sendRequest_selfRequest() {
        // Arrange & Act & Assert
        assertThatThrownBy(() -> friendService.sendRequest(1L, 1L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.INVALID_INPUT);
    }

    @Test
    @DisplayName("일촌 신청 실패 - 이미 일촌이거나 신청 중")
    void sendRequest_alreadyExists() {
        // Arrange
        Friend existing = Friend.builder().friendId(1L).status("ACCEPTED").build();
        given(friendMapper.findActiveByUsers(1L, 2L)).willReturn(Optional.of(existing));

        // Act & Assert
        assertThatThrownBy(() -> friendService.sendRequest(1L, 2L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.ALREADY_FRIEND);
    }

    @Test
    @DisplayName("일촌 신청 실패 - 동시 신청으로 DB 제약 충돌")
    void sendRequest_concurrentDuplicate() {
        // Arrange
        given(friendMapper.findActiveByUsers(1L, 2L)).willReturn(Optional.empty());
        given(friendMapper.insert(any(Friend.class))).willReturn(0); // ON CONFLICT DO NOTHING

        // Act & Assert
        assertThatThrownBy(() -> friendService.sendRequest(1L, 2L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.ALREADY_FRIEND);
    }

    // ── 일촌 수락 ──────────────────────────────────────────

    @Test
    @DisplayName("일촌 수락 성공")
    void acceptRequest_success() {
        // Arrange
        Long userId = 2L;
        Friend request = Friend.builder().friendId(1L).requesterId(1L).receiverId(2L).status("PENDING").build();
        given(friendMapper.findById(1L)).willReturn(Optional.of(request));

        given(friendMapper.updateStatus(1L, "ACCEPTED")).willReturn(1);

        // Act
        friendService.acceptRequest(userId, 1L);

        // Assert
        verify(friendMapper).updateStatus(1L, "ACCEPTED");
    }

    @Test
    @DisplayName("일촌 수락 실패 - 신청 없음")
    void acceptRequest_notFound() {
        // Arrange
        given(friendMapper.findById(99L)).willReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> friendService.acceptRequest(2L, 99L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.FRIEND_REQUEST_NOT_FOUND);
    }

    @Test
    @DisplayName("일촌 수락 실패 - 수신자가 아님")
    void acceptRequest_forbidden() {
        // Arrange
        Friend request = Friend.builder().friendId(1L).requesterId(1L).receiverId(2L).status("PENDING").build();
        given(friendMapper.findById(1L)).willReturn(Optional.of(request));

        // Act & Assert
        assertThatThrownBy(() -> friendService.acceptRequest(3L, 1L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.FRIEND_FORBIDDEN);
    }

    @Test
    @DisplayName("일촌 수락 실패 - PENDING 상태가 아님")
    void acceptRequest_notPending() {
        // Arrange
        Friend request = Friend.builder().friendId(1L).requesterId(1L).receiverId(2L).status("ACCEPTED").build();
        given(friendMapper.findById(1L)).willReturn(Optional.of(request));

        // Act & Assert
        assertThatThrownBy(() -> friendService.acceptRequest(2L, 1L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.FRIEND_REQUEST_NOT_FOUND);
    }

    // ── 일촌 거절 ──────────────────────────────────────────

    @Test
    @DisplayName("일촌 거절 성공")
    void rejectRequest_success() {
        // Arrange
        Long userId = 2L;
        Friend request = Friend.builder().friendId(1L).requesterId(1L).receiverId(2L).status("PENDING").build();
        given(friendMapper.findById(1L)).willReturn(Optional.of(request));

        given(friendMapper.updateStatus(1L, "REJECTED")).willReturn(1);

        // Act
        friendService.rejectRequest(userId, 1L);

        // Assert
        verify(friendMapper).updateStatus(1L, "REJECTED");
    }

    @Test
    @DisplayName("일촌 거절 실패 - 권한 없음")
    void rejectRequest_forbidden() {
        // Arrange
        Friend request = Friend.builder().friendId(1L).requesterId(1L).receiverId(2L).status("PENDING").build();
        given(friendMapper.findById(1L)).willReturn(Optional.of(request));

        // Act & Assert
        assertThatThrownBy(() -> friendService.rejectRequest(3L, 1L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.FRIEND_FORBIDDEN);
    }

    // ── 일촌 목록 ──────────────────────────────────────────

    @Test
    @DisplayName("일촌 목록 조회 성공")
    void getFriends_success() {
        // Arrange
        Long userId = 1L;
        List<Friend> friends = List.of(
                Friend.builder().friendId(1L).requesterId(1L).receiverId(2L).status("ACCEPTED").build(),
                Friend.builder().friendId(2L).requesterId(3L).receiverId(1L).status("ACCEPTED").build()
        );
        given(friendMapper.findAcceptedByUserId(userId)).willReturn(friends);

        // Act
        List<FriendResponse> responses = friendService.getFriends(userId);

        // Assert
        assertThat(responses).hasSize(2);
    }

    // ── 일촌 끊기 ──────────────────────────────────────────

    @Test
    @DisplayName("일촌 끊기 성공")
    void terminate_success() {
        // Arrange
        Long userId = 1L;
        Friend friend = Friend.builder().friendId(1L).requesterId(1L).receiverId(2L).status("ACCEPTED").build();
        given(friendMapper.findById(1L)).willReturn(Optional.of(friend));

        given(friendMapper.terminate(1L)).willReturn(1);

        // Act
        friendService.terminate(userId, 1L);

        // Assert
        verify(friendMapper).terminate(1L);
    }

    @Test
    @DisplayName("일촌 끊기 실패 - 일촌 관계 없음")
    void terminate_notFound() {
        // Arrange
        given(friendMapper.findById(99L)).willReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> friendService.terminate(1L, 99L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.FRIEND_NOT_FOUND);
    }

    @Test
    @DisplayName("일촌 끊기 실패 - 권한 없음")
    void terminate_forbidden() {
        // Arrange
        Friend friend = Friend.builder().friendId(1L).requesterId(1L).receiverId(2L).status("ACCEPTED").build();
        given(friendMapper.findById(1L)).willReturn(Optional.of(friend));

        // Act & Assert
        assertThatThrownBy(() -> friendService.terminate(3L, 1L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.FRIEND_FORBIDDEN);
    }
}
