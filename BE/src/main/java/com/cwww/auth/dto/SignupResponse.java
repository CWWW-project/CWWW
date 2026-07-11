package com.cwww.auth.dto;

import com.cwww.user.domain.User;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class SignupResponse {
    private  Long userId;
    private String email;
    private String nickname;

    public static SignupResponse from(User user) {
        return new SignupResponse(user.getUserId(), user.getEmail(), user.getNickname());
    }
}
