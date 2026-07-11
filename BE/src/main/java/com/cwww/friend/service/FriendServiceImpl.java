package com.cwww.friend.service;

import com.cwww.friend.domain.Friend;
import com.cwww.friend.dto.response.FriendResponse;
import com.cwww.friend.mapper.FriendMapper;
import com.cwww.global.exception.BusinessException;
import com.cwww.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FriendServiceImpl implements FriendService {

    private final FriendMapper friendMapper;

    @Override
    @Transactional
    public void sendRequest(Long requesterId, Long receiverId) {
        if (requesterId.equals(receiverId)) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }

        friendMapper.findActiveByUsers(requesterId, receiverId)
                .ifPresent(f -> { throw new BusinessException(ErrorCode.ALREADY_FRIEND); });

        Friend friend = Friend.builder()
                .requesterId(requesterId)
                .receiverId(receiverId)
                .status("PENDING")
                .build();

        friendMapper.insert(friend);
    }

    @Override
    @Transactional
    public void acceptRequest(Long userId, Long friendId) {
        Friend friend = findPendingById(friendId);

        if (!friend.getReceiverId().equals(userId)) {
            throw new BusinessException(ErrorCode.FRIEND_FORBIDDEN);
        }

        friendMapper.updateStatus(friendId, "ACCEPTED");
    }

    @Override
    @Transactional
    public void rejectRequest(Long userId, Long friendId) {
        Friend friend = findPendingById(friendId);

        if (!friend.getReceiverId().equals(userId)) {
            throw new BusinessException(ErrorCode.FRIEND_FORBIDDEN);
        }

        friendMapper.updateStatus(friendId, "REJECTED");
    }

    @Override
    @Transactional(readOnly = true)
    public List<FriendResponse> getFriends(Long userId) {
        return friendMapper.findAcceptedByUserId(userId).stream()
                .map(FriendResponse::from)
                .toList();
    }

    @Override
    @Transactional
    public void terminate(Long userId, Long friendId) {
        Friend friend = friendMapper.findById(friendId)
                .orElseThrow(() -> new BusinessException(ErrorCode.FRIEND_NOT_FOUND));

        if (!friend.getRequesterId().equals(userId) && !friend.getReceiverId().equals(userId)) {
            throw new BusinessException(ErrorCode.FRIEND_FORBIDDEN);
        }

        friendMapper.terminate(friendId);
    }

    private Friend findPendingById(Long friendId) {
        Friend friend = friendMapper.findById(friendId)
                .orElseThrow(() -> new BusinessException(ErrorCode.FRIEND_REQUEST_NOT_FOUND));

        if (!"PENDING".equals(friend.getStatus())) {
            throw new BusinessException(ErrorCode.FRIEND_REQUEST_NOT_FOUND);
        }

        return friend;
    }
}
