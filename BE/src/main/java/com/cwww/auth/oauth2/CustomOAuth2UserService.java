package com.cwww.auth.oauth2;

import com.cwww.user.domain.User;
import com.cwww.user.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    private static final int GITHUB_API_TIMEOUT_MS = 3000;

    private final UserMapper userMapper;
    private final RestClient restClient = RestClient.builder()
            .requestFactory(createTimeoutRequestFactory())
            .build();

    private static ClientHttpRequestFactory createTimeoutRequestFactory() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(GITHUB_API_TIMEOUT_MS);
        factory.setReadTimeout(GITHUB_API_TIMEOUT_MS);
        return factory;
    }

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = new DefaultOAuth2UserService().loadUser(userRequest);

        String provider = userRequest.getClientRegistration().getRegistrationId();
        Map<String, Object> rawAttributes = new HashMap<>(oAuth2User.getAttributes());

        // GitHub는 프로필 이메일이 비공개면 /user 응답에 email이 안 옴 → 같은 이메일 계정 연동이 불가능해짐
        // /user/emails로 인증된 주 이메일을 따로 조회해서 채워줌
        if ("github".equals(provider) && rawAttributes.get("email") == null) {
            String primaryEmail = fetchGitHubPrimaryEmail(userRequest.getAccessToken().getTokenValue());
            if (primaryEmail != null) {
                rawAttributes.put("email", primaryEmail);
            }
        }

        OAuthAttributes attrs = OAuthAttributes.of(provider, rawAttributes);

        User user;
        try {
            user = findOrCreate(attrs);
        } catch (Exception e) {
            // unchecked 예외를 OAuth2AuthenticationException으로 감싸야
            // AbstractAuthenticationProcessingFilter가 failureHandler로 넘길 수 있음
            log.error("OAuth 유저 처리 실패: provider={}, email={}", attrs.getProvider(), attrs.getEmail(), e);
            throw new OAuth2AuthenticationException(
                    new OAuth2Error("user_processing_error"), e.getMessage(), e);
        }

        // 성공 핸들러에서 쓸 커스텀 속성 추가
        rawAttributes.put("cwww_user_id", user.getUserId());
        rawAttributes.put("cwww_nickname", user.getNickname());
        rawAttributes.put("cwww_role", user.getRole());

        return new DefaultOAuth2User(
                Collections.singleton(new SimpleGrantedAuthority("ROLE_" + user.getRole())),
                rawAttributes,
                "cwww_user_id"
        );
    }

    private String fetchGitHubPrimaryEmail(String accessToken) {
        try {
            List<Map<String, Object>> emails = restClient.get()
                    .uri("https://api.github.com/user/emails")
                    .header("Authorization", "Bearer " + accessToken)
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {});
            if (emails == null) {
                return null;
            }
            return emails.stream()
                    .filter(e -> Boolean.TRUE.equals(e.get("primary")) && Boolean.TRUE.equals(e.get("verified")))
                    .map(e -> (String) e.get("email"))
                    .findFirst()
                    .orElse(null);
        } catch (Exception e) {
            log.warn("GitHub 이메일 조회 실패", e);
            return null;
        }
    }

    private User findOrCreate(OAuthAttributes attrs) {
        User existing = userMapper.findByProviderAndProviderId(attrs.getProvider(), attrs.getProviderId());
        if (existing != null) {
            return existing;
        }

        // 같은 이메일로 이미 가입된 계정(일반가입 또는 다른 provider)이 있으면
        // 새로 만들지 않고 그 계정에 OAuth 연동
        User byEmail = userMapper.findByEmail(attrs.getEmail());
        if (byEmail != null) {
            userMapper.linkOAuthProvider(byEmail.getUserId(), attrs.getProvider(), attrs.getProviderId());
            byEmail.setProvider(attrs.getProvider());
            byEmail.setProviderId(attrs.getProviderId());
            log.info("기존 계정에 OAuth 연동: userId={}, provider={}", byEmail.getUserId(), attrs.getProvider());
            return byEmail;
        }

        // 닉네임 중복 시 난수 붙이기
        String nickname = attrs.getNickname();
        if (userMapper.findByNickname(nickname) != null) {
            nickname = nickname + "_" + (int) (Math.random() * 9000 + 1000);
        }

        User newUser = User.builder()
                .email(attrs.getEmail())
                .nickname(nickname)
                .provider(attrs.getProvider())
                .providerId(attrs.getProviderId())
                .role("USER")
                .status("ACTIVE")
                .build();

        userMapper.insertOAuth(newUser);
        log.info("OAuth 신규 유저 생성: provider={}", attrs.getProvider());
        return newUser;
    }
}
