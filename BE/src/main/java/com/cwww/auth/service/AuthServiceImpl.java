package com.cwww.auth.service;

import com.cwww.auth.dto.LoginRequest;
import com.cwww.auth.dto.LoginResponse;
import com.cwww.auth.dto.OAuthTokenResponse;
import com.cwww.auth.dto.SignupRequest;
import com.cwww.auth.dto.SignupResponse;
import com.cwww.auth.jwt.JwtUtil;
import com.cwww.global.exception.BusinessException;
import com.cwww.global.exception.ErrorCode;
import com.cwww.user.domain.User;
import com.cwww.user.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private static final String OAUTH_CODE_PREFIX = "oauth:code:";

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final RedisTemplate<String, String> redisTemplate;

    @Override
    @Transactional
    public SignupResponse signup(SignupRequest request) {
        if (userMapper.findByEmail(request.getEmail()) != null) {
            throw new BusinessException(ErrorCode.DUPLICATE_EMAIL);
        }
        if (userMapper.findByNickname(request.getNickname()) != null) {
            throw new BusinessException(ErrorCode.DUPLICATE_NICKNAME);
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .nickname(request.getNickname())
                .role("USER")
                .build();

        try {
            userMapper.insert(user);
        } catch (DataIntegrityViolationException e) {
            String msg = e.getMostSpecificCause().getMessage();
            if (msg != null && msg.contains("email")) {
                throw new BusinessException(ErrorCode.DUPLICATE_EMAIL);
            } else if (msg != null && msg.contains("nickname")) {
                throw new BusinessException(ErrorCode.DUPLICATE_NICKNAME);
            }
            throw new BusinessException(ErrorCode.DUPLICATE_RESOURCE);
        }

        return SignupResponse.from(user);
    }

    @Override
    public LoginResponse login(LoginRequest request) {
        User user = userMapper.findByEmail(request.getEmail());
        if (user == null) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND);
        }
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BusinessException(ErrorCode.INVALID_PASSWORD);
        }

        String accessToken = jwtUtil.createAccessToken(user.getUserId(), user.getRole());
        String refreshToken = jwtUtil.createRefreshToken(user.getUserId());
        return LoginResponse.of(accessToken, refreshToken, user);
    }

    @Override
    public OAuthTokenResponse exchangeOAuthCode(String code) {
        // getAndDelete: 읽는 즉시 삭제 → 일회용 보장
        String value = redisTemplate.opsForValue().getAndDelete(OAUTH_CODE_PREFIX + code);
        if (value == null) {
            throw new BusinessException(ErrorCode.OAUTH_CODE_INVALID);
        }
        // 저장 형식: "{userId}\n{nickname}\n{role}"
        String[] parts = value.split("\n", 3);
        Long userId = Long.parseLong(parts[0]);
        String nickname = parts[1];
        String role = parts[2];
        String accessToken = jwtUtil.createAccessToken(userId, role);
        return new OAuthTokenResponse(accessToken, userId, nickname);
    }
}
