package com.cwww.auth.oauth2;

import lombok.Builder;
import lombok.Getter;

import java.util.Map;

@Getter
@Builder
public class OAuthAttributes {

    private String provider;
    private String providerId;
    private String email;
    private String nickname;

    public static OAuthAttributes of(String provider, Map<String, Object> attributes) {
        return switch (provider) {
            case "google" -> ofGoogle(attributes);
            case "github" -> ofGitHub(attributes);
            default -> throw new IllegalArgumentException("지원하지 않는 OAuth 제공자: " + provider);
        };
    }

    private static OAuthAttributes ofGoogle(Map<String, Object> attributes) {
        return OAuthAttributes.builder()
                .provider("google")
                .providerId((String) attributes.get("sub"))
                .email((String) attributes.get("email"))
                .nickname((String) attributes.get("name"))
                .build();
    }

    private static OAuthAttributes ofGitHub(Map<String, Object> attributes) {
        String providerId = String.valueOf(attributes.get("id"));
        String email = (String) attributes.get("email");
        String nickname = (String) attributes.get("login"); // GitHub 사용자명

        // GitHub는 이메일 비공개 설정 시 null 반환
        if (email == null || email.isBlank()) {
            email = providerId + "@github.oauth";
        }

        return OAuthAttributes.builder()
                .provider("github")
                .providerId(providerId)
                .email(email)
                .nickname(nickname)
                .build();
    }
}
