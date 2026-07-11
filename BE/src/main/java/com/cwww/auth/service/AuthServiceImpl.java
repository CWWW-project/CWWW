package com.cwww.auth.service;

import com.cwww.auth.dto.SignupRequest;
import com.cwww.auth.dto.SignupResponse;
import com.cwww.global.exception.BusinessException;
import com.cwww.global.exception.ErrorCode;
import com.cwww.user.domain.User;
import com.cwww.user.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public SignupResponse signup(SignupRequest request) {
        if (userMapper.findByEmail(request.getEmail()) != null) {
            throw new BusinessException(ErrorCode.DUPLICATE_EMAIL);
        } if (userMapper.findByNickname(request.getNickname()) != null) {
            throw new BusinessException(ErrorCode.DUPLICATE_NICKNAME);
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .nickname(request.getNickname())
                .role("USER")
                .build();

        userMapper.insert(user);
        return SignupResponse.from(user);
    }
}
