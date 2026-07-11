package com.cwww.friend.service;

import com.cwww.friend.dto.response.FriendResponse;

import java.util.List;

public interface FriendService {

    void sendRequest(Long requesterId, Long receiverId);

    void acceptRequest(Long userId, Long friendId);

    void rejectRequest(Long userId, Long friendId);

    List<FriendResponse> getFriends(Long userId);

    void terminate(Long userId, Long friendId);
}
