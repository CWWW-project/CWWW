package com.cwww.friend.service;

import com.cwww.friend.dto.response.FriendResponse;
import com.cwww.friend.dto.response.FriendSendResponse;

import java.util.List;

public interface FriendService {

    FriendSendResponse sendRequest(Long requesterId, Long receiverId, String requesterAlias, String receiverAlias);

    void acceptRequest(Long userId, Long friendId);

    void rejectRequest(Long userId, Long friendId);

    List<FriendResponse> getFriends(Long userId);

    List<FriendResponse> getPendingRequests(Long userId);

    void setAlias(Long userId, Long friendId, String alias);

    void terminate(Long userId, Long friendId);
}
