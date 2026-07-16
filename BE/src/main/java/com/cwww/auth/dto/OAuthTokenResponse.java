package com.cwww.auth.dto;

public record OAuthTokenResponse(String accessToken, Long userId, String nickname) {}
