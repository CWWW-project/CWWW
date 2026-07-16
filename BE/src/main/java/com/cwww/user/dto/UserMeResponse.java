package com.cwww.user.dto;

import com.cwww.user.domain.User;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class UserMeResponse {

    private Long userId;
    private String email;
    private String nickname;
    private String role;
    private String provider;
    private LocalDateTime createdAt;

    public static UserMeResponse from(User user) {
        return UserMeResponse.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .nickname(user.getNickname())
                .role(user.getRole())
                .provider(user.getProvider())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
