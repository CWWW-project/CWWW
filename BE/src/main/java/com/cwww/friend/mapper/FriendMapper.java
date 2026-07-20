package com.cwww.friend.mapper;

import com.cwww.friend.domain.Friend;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Optional;

@Mapper
public interface FriendMapper {

    boolean isFriend(@Param("userId1") Long userId1, @Param("userId2") Long userId2);

    int insert(Friend friend);

    Optional<Friend> findById(Long friendId);

    Optional<Friend> findActiveByUsers(@Param("userId1") Long userId1, @Param("userId2") Long userId2);

    int updateStatus(@Param("friendId") Long friendId, @Param("status") String status);

    List<Friend> findAcceptedByUserId(Long userId);

    List<Long> findAcceptedFriendUserIds(Long userId);

    int terminate(Long friendId);

    List<Friend> findPendingByReceiverId(Long receiverId);

    int updateAlias(@Param("friendId") Long friendId,
                    @Param("requesterId") Long requesterId,
                    @Param("alias") String alias);
}
