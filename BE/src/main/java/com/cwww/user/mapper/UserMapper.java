package com.cwww.user.mapper;

import com.cwww.user.domain.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface UserMapper {
    void insert(User user);
    User findByEmail(String email);
    User findByNickname(String nickname);
    String findNicknameById(Long userId);
    List<User> findByIds(@Param("userIds") List<Long> userIds);

    List<User> searchByNickname(@Param("keyword") String keyword, @Param("limit") int limit);
    int activateUser(@Param("email") String email);

}
