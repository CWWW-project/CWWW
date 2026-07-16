package com.cwww.auth.oauth2;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.time.Duration;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private static final String CODE_PREFIX = "oauth:code:";
    private static final Duration CODE_TTL = Duration.ofSeconds(30);

    private final RedisTemplate<String, String> redisTemplate;

    @Value("${oauth2.redirect-uri}")
    private String redirectUri;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        Long userId = ((Number) oAuth2User.getAttribute("cwww_user_id")).longValue();
        String nickname = (String) oAuth2User.getAttribute("cwww_nickname");

        // JWT는 교환 API에서 발급 → 여기서는 30초짜리 일회용 코드만 발급
        String code = UUID.randomUUID().toString();
        redisTemplate.opsForValue().set(CODE_PREFIX + code, userId + "\n" + nickname, CODE_TTL);

        String targetUrl = UriComponentsBuilder.fromUriString(redirectUri)
                .queryParam("code", code)
                .build().toUriString();

        log.info("OAuth 로그인 성공: userId={}", userId);
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
