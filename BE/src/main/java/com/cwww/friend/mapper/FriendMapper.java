package com.cwww.friend.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface FriendMapper {

    boolean isFriend(@Param("userId1") Long userId1, @Param("userId2") Long userId2);
}
