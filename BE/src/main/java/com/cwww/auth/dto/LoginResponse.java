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
    private String nickname;

    public static LoginResponse of(String accessToken, String refreshToken, User user) {
        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .userId(user.getUserId())
                .nickname(user.getNickname())
                .build();
    }
}
