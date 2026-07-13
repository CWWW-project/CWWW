package com.cwww.auth.jwt;

import com.cwww.global.exception.BusinessException;
import com.cwww.global.exception.ErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;

class JwtUtilTest {

    // HS256용 256bit(32자) 이상 시크릿
    private static final String SECRET = "CwwwTestSecretKey1234567890abcdefghijk";
    private static final long ACCESS_EXP = 1_800_000L; //30분
    private static final long REFRESH_EXP = 1_209_600_000L; //14일

    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil(SECRET,ACCESS_EXP,REFRESH_EXP);
    }

    @Test
    @DisplayName("AccessToken 생성 후 파싱하면 userId,role이 그대로 나온다")
    void createAccessToken_roundTrip() {
        //Arrange
        Long userId=1L;
        String role = "ROLE_USER";

        //Act
        String token = jwtUtil.createAccessToken(userId,role);

        //Assert
        assertThat(jwtUtil.getUserId(token)).isEqualTo(userId);
        assertThat(jwtUtil.getRole(token)).isEqualTo(role);
    }

    @Test
    @DisplayName("RefreshToken 생성 후 파싱하면 userId가 나온다")
    void createRefreshToken_roundTrip() {
        // Arrange
        Long userId = 1L;

        // Act
        String token = jwtUtil.createRefreshToken(userId);

        // Assert
        assertThat(jwtUtil.getUserId(token)).isEqualTo(userId);
    }

    @Test
    @DisplayName("정상 토큰은 validateToken 시 예외가 발생하지 않는다")
    void validateToken_valid() {
        // Arrange
        String token = jwtUtil.createAccessToken(1L, "ROLE_USER");

        // Act & Assert
        assertThatCode(() -> jwtUtil.validateToken(token)).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("만료된 토큰은 EXPIRED_TOKEN 예외가 발생한다")
    void validateToken_expired() {
        // Arrange — 만료시간 음수 인스턴스로 이미 만료된 토큰 생성
        JwtUtil expiredUtil = new JwtUtil(SECRET, -1000L, -1000L);
        String expiredToken = expiredUtil.createAccessToken(1L, "ROLE_USER");

        // Act & Assert
        assertThatThrownBy(() -> jwtUtil.validateToken(expiredToken))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.EXPIRED_TOKEN);

    }

    @Test
    @DisplayName("다른 시크릿으로 서명된 위조 토큰은 INVALID_TOKEN 예외가 발생한다")
    void validateToken_invalidSignature() {
        // Arrange — 완전히 다른 시크릿으로 서명한 토큰
        JwtUtil otherUtil = new JwtUtil("CompletelyDifferentSecret0987654321zyxwvu", ACCESS_EXP, REFRESH_EXP);
        String forgedToken = otherUtil.createAccessToken(1L, "ROLE_USER");

        // Act & Assert
        assertThatThrownBy(() -> jwtUtil.validateToken(forgedToken))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.INVALID_TOKEN);
    }
}
