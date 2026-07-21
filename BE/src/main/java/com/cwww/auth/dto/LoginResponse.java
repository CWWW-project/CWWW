package com.cwww.auth.dto;

import com.cwww.user.domain.User;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class LoginResponse {

    private String accessToken;
    @JsonIgnore
    private String refreshToken;
    private Long userId;
    private String email;      // ← 추가!
    private String nickname;
    private String role;       // ← 추가!

    public static LoginResponse of(String accessToken, String refreshToken, User user) {
        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .userId(user.getUserId())
                .email(user.getEmail())           // ← 추가!
                .nickname(user.getNickname())
                .role(user.getRole())             // ← 추가!
                .build();
    }
}