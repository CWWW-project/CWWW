package com.cwww.auth.email;

import com.cwww.global.exception.BusinessException;
import com.cwww.global.exception.ErrorCode;
import com.cwww.user.domain.User;
import com.cwww.user.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;

@Service
@RequiredArgsConstructor
public class EmailVerificationServiceImpl implements EmailVerificationService {

    private static final String KEY_PREFIX = "email:verify:";
    private static final String VERIFIED_PREFIX = "email:verified:";
    private static final Duration CODE_TTL = Duration.ofMinutes(5);
    private static final Duration VERIFIED_TTL = Duration.ofMinutes(10);
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final RedisTemplate<String,String> redisTemplate;
    private final JavaMailSender mailSender;
    private final UserMapper userMapper;

    @Value("${spring.mail.username}")
    private String mailUsername;

    @Override
    public void sendCode(String email) {
        if (userMapper.findByEmail(email) != null) {
            throw new BusinessException(ErrorCode.DUPLICATE_EMAIL);
        }
        String code = generateCode();

        redisTemplate.opsForValue().set(KEY_PREFIX + email, code, CODE_TTL);

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setFrom(mailUsername);
        message.setSubject("[CWWW] 이메일 인증 코드");
        message.setText("인증 코드:" + code + " (5분 이내에 입력해주세요)");

        try {
            mailSender.send(message);
        } catch (MailException e) {
            throw new BusinessException(ErrorCode.MAIL_SEND_FAILED);
        }
    }
    @Override
    public void verifyCode(String email, String code) {
        String savedCode = redisTemplate.opsForValue().get(KEY_PREFIX + email);
        if (savedCode == null || !savedCode.equals(code)) {
            throw new BusinessException(ErrorCode.INVALID_VERIFICATION_CODE);
        }

        redisTemplate.delete(KEY_PREFIX + email);
        redisTemplate.opsForValue().set(VERIFIED_PREFIX + email, "true", VERIFIED_TTL);
    }

    public boolean isVerified(String email) {
        return Boolean.parseBoolean(redisTemplate.opsForValue().get(VERIFIED_PREFIX + email));
    }

    public void deleteVerifiedFlag(String email) {
        redisTemplate.delete(VERIFIED_PREFIX + email);
    }

    private String generateCode() {
        int number = SECURE_RANDOM.nextInt(1_000_000);
        return String.format("%06d",number);
    }
}
