package com.cwww.auth.email;

import com.cwww.global.exception.BusinessException;
import com.cwww.global.exception.ErrorCode;
import com.cwww.user.domain.User;
import com.cwww.user.mapper.UserMapper;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.UnsupportedEncodingException;
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

        MimeMessage mimeMessage = mailSender.createMimeMessage();
        try {
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "UTF-8");
            helper.setTo(email);
            helper.setFrom(mailUsername, "CWWW");
            helper.setSubject("[CWWW] 이메일 인증 코드");
            helper.setText("""
                <div style="background:#f0ebe6;padding:40px 0;font-family:Arial,sans-serif;">
                  <div style="max-width:480px;margin:0 auto;background:#fff;border:2px solid #8e7164;border-radius:4px;">
                    <div style="background:linear-gradient(to right,#a33e00,#7c2e00);padding:8px 14px;">
                      <span style="color:#fff;font-size:12px;font-weight:bold;">CWWW — 이메일 인증</span>
                    </div>
                    <div style="padding:32px 28px;">
                      <h2 style="margin:0 0 8px;font-size:22px;color:#7c2e00;">안녕하세요!</h2>
                      <p style="margin:0 0 24px;font-size:14px;color:#5a4136;line-height:1.6;">
                        CWWW 가입을 위한 이메일 인증 코드입니다.<br>
                        아래 코드를 입력창에 넣어주세요.
                      </p>
                      <div style="background:#f9f3ef;border:2px solid #c49a80;border-radius:4px;padding:20px;text-align:center;margin-bottom:24px;">
                        <p style="margin:0 0 8px;font-size:11px;color:#8a6a5e;letter-spacing:2px;">인증 코드</p>
                        <span style="font-size:36px;font-weight:bold;letter-spacing:12px;color:#a33e00;">%s</span>
                      </div>
                      <p style="margin:0;font-size:12px;color:#8a6a5e;text-align:center;">
                        이 코드는 <strong>5분</strong> 동안 유효합니다.<br>
                        본인이 요청하지 않았다면 이 메일을 무시해주세요.
                      </p>
                    </div>
                  </div>
                </div>
                """.formatted(code), true);
            mailSender.send(mimeMessage);
        } catch (MessagingException | UnsupportedEncodingException | MailException e) {
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
