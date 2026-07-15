package com.cwww.auth.email;

/*
① 존재하는 유저에게
② 6자리 랜덤 코드를 생성해서
③ Redis에 5분 TTL로 저장하고
④ 메일로 실제 발송 호출까지 하는지를 검증
   4가지 다 통과해야 테스트 성공.
*/

import com.cwww.global.exception.BusinessException;
import com.cwww.global.exception.ErrorCode;
import com.cwww.user.domain.User;
import com.cwww.user.mapper.UserMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class EmailVerificationServiceTest {

    @Mock
    private RedisTemplate<String, String> redisTemplate;
    @Mock
    private ValueOperations<String, String> valueOperations;
    @Mock
    private JavaMailSender mailSender;
    @Mock
    private UserMapper userMapper;

    private EmailVerificationServiceImpl emailVerificationService;

    @BeforeEach
    void setUp() {
        emailVerificationService = new EmailVerificationServiceImpl(redisTemplate, mailSender, userMapper);
    }

    @Test
    @DisplayName("가입된 이메일로 인증코드 발송 시 Redis에 6자리 코드가 5분 TTL로 저장되고 메일이 발송된다")
    void sendCode_success() {
        //Arrange
        String email = "test@test.com";

        given(userMapper.findByEmail(email)).willReturn(User.builder().email(email).build());
        given(redisTemplate.opsForValue()).willReturn(valueOperations);

        // Act 실행
        emailVerificationService.sendCode(email);

        // Assert 검증
        ArgumentCaptor<String> codeCaptor = ArgumentCaptor.forClass(String.class);
        verify(valueOperations).set(eq("email:verify:" + email), codeCaptor.capture(), eq(Duration.ofMinutes(5)));
        assertThat(codeCaptor.getValue()).matches("^\\d{6}$");
        verify(mailSender).send(any(SimpleMailMessage.class));
    }

    @Test
    @DisplayName("가입되지 않은 이메일로 인증코드 발송 시 USER_NOT_FOUND 예외가 발생한다")
    void sendCode_userNotFound() {
        //Arrange
        String email = "notfound@test.com";
        given(userMapper.findByEmail(email)).willReturn(null);

        //Act & Assert
        assertThatThrownBy(() -> emailVerificationService.sendCode(email))
                .isInstanceOf(BusinessException.class).extracting("errorCode")
                .isEqualTo(ErrorCode.USER_NOT_FOUND);

    }

    @Test
    @DisplayName("올바른 인증코드로 검증 시 유저 status가 ACTIVE로 바뀌고 Redis 키가 삭제된다")
    void verifyCode_success() {
        //Arrange
        String email = "test@test.com";
        String code = "123456";
        given(redisTemplate.opsForValue()).willReturn(valueOperations);

        given(valueOperations.get("email:verify:" + email)).willReturn(code);

        //Act
        emailVerificationService.verifyCode(email, code);
        //Assert
        verify(userMapper).activateUser(email);
        verify(redisTemplate).delete("email:verify:" + email);
    }

    @Test
    @DisplayName("인증코드가 일치하지 않으면 INVALID_VERIFICATION_CODE 예외가 발생한다")
    void verifyCode_mismatch() {
        //Arrange
        String email = "test@test.com";
        given(redisTemplate.opsForValue()).willReturn(valueOperations);

        given(valueOperations.get("email:verify:" + email)).willReturn("111111");

        //Act & Assert
        assertThatThrownBy(() -> emailVerificationService.verifyCode(email, "222222"))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.INVALID_VERIFICATION_CODE);
    }

    @Test
    @DisplayName("인증코드가 만료(또는 미발송)되어 Redis에 없으면 INVALID_VERIFICATION_CODE 예외가 발생한다")
    void verifyCode_expiredOrMissing() {
        //Arrange
        String email = "test@test.com";
        given(redisTemplate.opsForValue()).willReturn(valueOperations);

        given(valueOperations.get("email:verify:" + email)).willReturn(null);

        // Act & Assert
        assertThatThrownBy(() -> emailVerificationService.verifyCode(email, "123456"))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.INVALID_VERIFICATION_CODE);
    }
}
