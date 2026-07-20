package com.cwww.auth.service;

import com.cwww.auth.dto.LoginRequest;
import com.cwww.auth.dto.LoginResponse;
import com.cwww.auth.dto.OAuthTokenResponse;
import com.cwww.auth.dto.SignupRequest;
import com.cwww.auth.dto.SignupResponse;
import com.cwww.auth.email.EmailVerificationService;
import com.cwww.auth.jwt.JwtUtil;
import com.cwww.global.exception.BusinessException;
import com.cwww.global.exception.ErrorCode;
import com.cwww.user.domain.User;
import com.cwww.user.mapper.UserMapper;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.UnsupportedEncodingException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private static final String OAUTH_CODE_PREFIX = "oauth:code:";
    private static final ZoneId ZONE = ZoneId.systemDefault();
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final JavaMailSender mailSender;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EmailVerificationService emailVerificationService;
    private final RedisTemplate<String, String> redisTemplate;

    @Value("${spring.mail.username}")
    private String mailUsername;

    // 비밀번호
    @Override
    public void forgotPassword(String email) {
        User user = userMapper.findByEmail(email);
        if (user == null) {
            // 계정 존재 여부를 응답으로 노출하지 않기 위해 존재하지 않아도 동일하게 성공 처리
            return;
        }
        String resetToken = generateResetToken();
        userMapper.updateResetToken(email, resetToken, LocalDateTime.now().plusMinutes(30));

        MimeMessage mimeMessage = mailSender.createMimeMessage();
        try {
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "UTF-8");
            helper.setTo(email);
            helper.setFrom(mailUsername, "CWWW");
            helper.setSubject("[CWWW] 비밀번호 재설정");
            helper.setText("""
                <div style="background:#f0ebe6;padding:40px 0;font-family:Arial,sans-serif;">
                  <div style="max-width:480px;margin:0 auto;background:#fff;border:2px solid #8e7164;border-radius:4px;">
                    <div style="background:linear-gradient(to right,#a33e00,#7c2e00);padding:8px 14px;">
                      <span style="color:#fff;font-size:12px;font-weight:bold;">CWWW — 비밀번호 재설정</span>
                    </div>
                    <div style="padding:32px 28px;">
                      <h2 style="margin:0 0 8px;font-size:22px;color:#7c2e00;">비밀번호를 잊으셨나요?</h2>
                      <p style="margin:0 0 24px;font-size:14px;color:#5a4136;line-height:1.6;">
                        비밀번호 재설정 요청이 접수되었습니다.<br>
                        아래 인증번호를 재설정 화면에 입력해주세요.
                      </p>
                      <div style="text-align:center;margin-bottom:24px;">
                        <span style="display:inline-block;background:#f0ebe6;color:#7c2e00;
                                     padding:14px 28px;border-radius:4px;font-size:26px;font-weight:bold;
                                     letter-spacing:4px;border:2px solid #7c2e00;">
                          %s
                        </span>
                      </div>
                      <p style="margin:0;font-size:12px;color:#8a6a5e;text-align:center;">
                        인증번호는 <strong>30분</strong> 동안 유효합니다.<br>
                        본인이 요청하지 않았다면 이 메일을 무시해주세요.
                      </p>
                    </div>
                  </div>
                </div>
                """.formatted(resetToken), true);
            mailSender.send(mimeMessage);
        } catch (MessagingException | UnsupportedEncodingException | MailException e) {
            throw new BusinessException(ErrorCode.MAIL_SEND_FAILED);
        }
    }

    private String generateResetToken() {
        return String.format("%08d", SECURE_RANDOM.nextInt(100_000_000));
    }

    @Override
    public void resetPassword(String resetToken, String newPassword) {
        User user = userMapper.findByResetToken(resetToken);
        if (user == null) {
            throw new BusinessException(ErrorCode.INVALID_RESET_TOKEN);
        }
        if (user.getResetTokenExpiresAt() == null || user.getResetTokenExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BusinessException(ErrorCode.EXPIRED_RESET_TOKEN);
        }
        userMapper.resetPassword(user.getUserId(), passwordEncoder.encode(newPassword));
    }

    @Override
    public void changePassword(Long userId, String currentPassword, String newPassword) {
        User user = userMapper.findById(userId);
        if (user == null) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND);
        }
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new BusinessException(ErrorCode.INVALID_PASSWORD);
        }
        int updated = userMapper.updatePassword(userId, passwordEncoder.encode(newPassword));
        if (updated != 1) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND);
        }
    }

    @Override
    public boolean isNicknameAvailable(String nickname) {
        return userMapper.findByNickname(nickname) == null;
    }


    @Override
    @Transactional
    public SignupResponse signup(SignupRequest request) {
        if (!emailVerificationService.isVerified(request.getEmail())) {
            throw new BusinessException(ErrorCode.EMAIL_NOT_VERIFIED);
        }
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

        try {
            emailVerificationService.deleteVerifiedFlag(request.getEmail());
        } catch (Exception e) {
            log.warn("이메일 인증 플래그 삭제 실패 — TTL 만료로 자동 소멸됨: email={}", request.getEmail(), e);
        }
        return SignupResponse.from(user);
    }

    @Override
    @Transactional
    public LoginResponse login(LoginRequest request) {
        User user = userMapper.findByEmail(request.getEmail());
        if (user == null) {
            throw new BusinessException(ErrorCode.EMAIL_NOT_FOUND);
        }
        if (user.getPassword() == null) {
            throw new BusinessException(ErrorCode.SOCIAL_LOGIN_REQUIRED);
        }
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BusinessException(ErrorCode.INVALID_PASSWORD);
        }

        String accessToken = jwtUtil.createAccessToken(user.getUserId(), user.getRole());
        String refreshToken = jwtUtil.createRefreshToken(user.getUserId());
        Date rtExpiry = jwtUtil.getExpiration(refreshToken);
        userMapper.saveRefreshToken(user.getUserId(), refreshToken,
                rtExpiry.toInstant().atZone(ZONE).toLocalDateTime());
        return LoginResponse.of(accessToken, refreshToken, user);
    }

    @Override
    @Transactional
    public LoginResponse refreshToken(String refreshToken) {
        // ① 서명·만료 검증
        jwtUtil.validateToken(refreshToken);
        if (jwtUtil.isAccessToken(refreshToken)) {
            throw new BusinessException(ErrorCode.INVALID_TOKEN);
        }
        // ② DB에 저장된 RT와 일치 검증 (재사용 방지)
        Long userId = jwtUtil.getUserId(refreshToken);
        User user = userMapper.findById(userId);
        if (user == null || !refreshToken.equals(user.getRefreshToken())) {
            throw new BusinessException(ErrorCode.INVALID_TOKEN);
        }
        // ③ 새 AT + RT 발급 (RTR: 기존 RT 즉시 교체)
        String newAt = jwtUtil.createAccessToken(userId, user.getRole());
        String newRt = jwtUtil.createRefreshToken(userId);
        Date newRtExpiry = jwtUtil.getExpiration(newRt);
        userMapper.saveRefreshToken(userId, newRt,
                newRtExpiry.toInstant().atZone(ZONE).toLocalDateTime());
        return LoginResponse.of(newAt, newRt, user);
    }

    @Override
    public void logout(Long userId, String accessToken) {
        // ① 남은 TTL 계산 후 AT 블랙리스트 등록
        if (accessToken != null) {
            try {
                Date expiry = jwtUtil.getExpiration(accessToken);
                long remainMs = expiry.getTime() - System.currentTimeMillis();
                if (remainMs > 0) {
                    redisTemplate.opsForValue().set(
                            JwtUtil.BLACKLIST_PREFIX + accessToken, "1", remainMs, TimeUnit.MILLISECONDS);
                }
            } catch (BusinessException ignored) {
                // 이미 만료된 AT는 블랙리스트 등록 불필요
            }
        }
        // ② DB에서 RT 삭제
        userMapper.deleteRefreshToken(userId);
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
