package com.cwww.auth.service;

import com.cwww.auth.dto.LoginRequest;
import com.cwww.auth.dto.LoginResponse;
import com.cwww.auth.dto.OAuthTokenResponse;
import com.cwww.auth.dto.SignupRequest;
import com.cwww.auth.dto.SignupResponse;

public interface AuthService {
    SignupResponse signup(SignupRequest request);
    LoginResponse login(LoginRequest request);
    OAuthTokenResponse exchangeOAuthCode(String code);
    LoginResponse refreshToken(String refreshToken);
    void logout(Long userId, String accessToken);

    void forgotPassword(String email);
    void resetPassword(String resetToken, String newPassword);
    void changePassword(Long userId, String currentPassword, String newPassword);

    boolean isNicknameAvailable(String nickname);
}
