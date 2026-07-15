package com.cwww.auth.email;

import com.cwww.global.exception.BusinessException;
import com.cwww.global.exception.ErrorCode;
import com.cwww.user.domain.User;
import com.cwww.user.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;

@Service
@RequiredArgsConstructor
public class EmailVerificationServiceImpl implements EmailVerificationService {

    private static final String KEY_PREFIX = "email:verify:";
    private static final Duration CODE_TTL = Duration.ofMinutes(5);

    private final RedisTemplate<String,String> redisTemplate;
    private final JavaMailSender mailSender;
    private final UserMapper userMapper;

    @Override
    public void sendCode(String email) {
        User user = userMapper.findByEmail(email);
        if (user == null) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND);

        }
        String code = generateCode();

        redisTemplate.opsForValue().set(KEY_PREFIX + email, code, CODE_TTL);

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("[CWWW] 이메일 인증 코드");
        message.setText("인증 코드:" + code + " (5분 이내에 입력해주세요)");
        mailSender.send(message);
    }
    @Override
    public void verifyCode(String email,String code) {
        String savedCode = redisTemplate.opsForValue().get(KEY_PREFIX + email);
        if (savedCode == null || !savedCode.equals(code)) {
            throw new BusinessException(ErrorCode.INVALID_VERIFICATION_CODE);
        }
        userMapper.activateUser(email);
        redisTemplate.delete(KEY_PREFIX + email);
    }

    private String generateCode() {
        int number = new SecureRandom().nextInt(1_000_000);
        return String.format("%06d",number);
    }
}
