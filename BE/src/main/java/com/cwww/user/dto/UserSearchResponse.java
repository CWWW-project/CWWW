package com.cwww.user.dto;

import com.cwww.user.domain.User;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserSearchResponse {

    private Long userId;
    private String nickname;

    public static UserSearchResponse from(User user) {
        return UserSearchResponse.builder()
                .userId(user.getUserId())
                .nickname(user.getNickname())
                .build();
    }
}
