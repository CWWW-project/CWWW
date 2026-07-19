package com.cwww.user.mapper;

import com.cwww.user.domain.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface UserMapper {
    void insert(User user);
    void insertOAuth(User user);
    User findByEmail(String email);
    User findById(Long userId);
    User findByNickname(String nickname);
    String findNicknameById(Long userId);
    List<User> findByIds(@Param("userIds") List<Long> userIds);
    User findByProviderAndProviderId(@Param("provider") String provider, @Param("providerId") String providerId);

    List<User> searchByNickname(@Param("keyword") String keyword, @Param("limit") int limit);
    int activateUser(@Param("email") String email);

    void saveRefreshToken(@Param("userId") Long userId,
                          @Param("refreshToken") String refreshToken,
                          @Param("expiresAt") LocalDateTime expiresAt);
    void deleteRefreshToken(Long userId);
    void updateNickname(@Param("userId") Long userId, @Param("nickname") String nickname);


    void updateResetToken(@Param("email") String email, @Param("resetToken") String resetToken, @Param("expiresAt") LocalDateTime expiresAt);
    User findByResetToken(@Param("resetToken") String resetToken);
    int resetPassword(@Param("userId") Long userId, @Param("password") String password);
    int updatePassword(@Param("userId") Long userId, @Param("password") String password);

    //회원탈퇴
    int withdraw(@Param("userId") Long userId);

}
