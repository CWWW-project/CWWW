package com.cwww.auth.oauth2;

import com.cwww.user.domain.User;
import com.cwww.user.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    private final UserMapper userMapper;

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = new DefaultOAuth2UserService().loadUser(userRequest);

        String provider = userRequest.getClientRegistration().getRegistrationId();
        OAuthAttributes attrs = OAuthAttributes.of(provider, oAuth2User.getAttributes());

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
        Map<String, Object> attributes = new HashMap<>(oAuth2User.getAttributes());
        attributes.put("cwww_user_id", user.getUserId());
        attributes.put("cwww_nickname", user.getNickname());

        return new DefaultOAuth2User(
                Collections.singleton(new SimpleGrantedAuthority("ROLE_" + user.getRole())),
                attributes,
                "cwww_user_id"
        );
    }

    private User findOrCreate(OAuthAttributes attrs) {
        User existing = userMapper.findByProviderAndProviderId(attrs.getProvider(), attrs.getProviderId());
        if (existing != null) {
            return existing;
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
        log.info("OAuth 신규 유저 생성: provider={}, email={}", attrs.getProvider(), attrs.getEmail());
        return newUser;
    }
}
