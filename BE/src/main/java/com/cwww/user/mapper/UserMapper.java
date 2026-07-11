package com.cwww.user.mapper;

import com.cwww.user.domain.User;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface UserMapper {
    void insert(User user);
    User findByEmail(String email);
    User findByNickname(String nickname);

}
