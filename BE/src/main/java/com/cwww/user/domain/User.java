package com.cwww.user.domain;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    private Long userId;
    private String email;
    private String password;
    private String nickname;
    private String role;
    private String provider;
    private String providerId;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;
    private String refreshToken;
    private LocalDateTime refreshTokenExpiresAt;
    private String resetToken;
    private LocalDateTime resetTokenExpiresAt;
    private int acornBalance;
}
