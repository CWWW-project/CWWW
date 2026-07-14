package com.cwww.friend.service;

import com.cwww.friend.domain.Friend;
import com.cwww.friend.dto.response.FriendResponse;
import com.cwww.friend.mapper.FriendMapper;
import com.cwww.global.exception.BusinessException;
import com.cwww.global.exception.ErrorCode;
import com.cwww.user.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FriendServiceImpl implements FriendService {

    private final FriendMapper friendMapper;
    private final UserMapper userMapper;

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

        int inserted = friendMapper.insert(friend);
        if (inserted == 0) {
            throw new BusinessException(ErrorCode.ALREADY_FRIEND);
        }
    }

    @Override
    @Transactional
    public void acceptRequest(Long userId, Long friendId) {
        Friend friend = findPendingById(friendId);

        if (!friend.getReceiverId().equals(userId)) {
            throw new BusinessException(ErrorCode.FRIEND_FORBIDDEN);
        }

        int updated = friendMapper.updateStatus(friendId, "ACCEPTED");
        if (updated == 0) {
            throw new BusinessException(ErrorCode.FRIEND_REQUEST_NOT_FOUND);
        }
    }

    @Override
    @Transactional
    public void rejectRequest(Long userId, Long friendId) {
        Friend friend = findPendingById(friendId);

        if (!friend.getReceiverId().equals(userId)) {
            throw new BusinessException(ErrorCode.FRIEND_FORBIDDEN);
        }

        int updated = friendMapper.updateStatus(friendId, "REJECTED");
        if (updated == 0) {
            throw new BusinessException(ErrorCode.FRIEND_REQUEST_NOT_FOUND);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<FriendResponse> getFriends(Long userId) {
        return friendMapper.findAcceptedByUserId(userId).stream()
                .map(f -> {
                    Long opponentId = f.getRequesterId().equals(userId) ? f.getReceiverId() : f.getRequesterId();
                    String nickname = userMapper.findNicknameById(opponentId);
                    return FriendResponse.from(f, nickname);
                })
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<FriendResponse> getPendingRequests(Long userId) {
        return friendMapper.findPendingByReceiverId(userId).stream()
                .map(f -> {
                    String nickname = userMapper.findNicknameById(f.getRequesterId());
                    return FriendResponse.from(f, nickname);
                })
                .toList();
    }

    @Override
    @Transactional
    public void setAlias(Long userId, Long friendId, String alias) {
        friendMapper.findById(friendId)
                .orElseThrow(() -> new BusinessException(ErrorCode.FRIEND_NOT_FOUND));
        int updated = friendMapper.updateAlias(friendId, userId, alias);
        if (updated == 0) {
            throw new BusinessException(ErrorCode.FRIEND_FORBIDDEN);
        }
    }

    @Override
    @Transactional
    public void terminate(Long userId, Long friendId) {
        Friend friend = friendMapper.findById(friendId)
                .orElseThrow(() -> new BusinessException(ErrorCode.FRIEND_NOT_FOUND));

        if (!friend.getRequesterId().equals(userId) && !friend.getReceiverId().equals(userId)) {
            throw new BusinessException(ErrorCode.FRIEND_FORBIDDEN);
        }

        int terminated = friendMapper.terminate(friendId);
        if (terminated == 0) {
            throw new BusinessException(ErrorCode.FRIEND_NOT_FOUND);
        }
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
