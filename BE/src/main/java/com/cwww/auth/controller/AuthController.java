package com.cwww.auth.controller;

import com.cwww.auth.dto.*;
import com.cwww.auth.email.EmailVerificationService;
import com.cwww.auth.service.AuthService;
import com.cwww.global.response.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final EmailVerificationService emailVerificationService;

    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<SignupResponse>>
    signup(@Valid @RequestBody SignupRequest request) {
        SignupResponse response = authService.signup(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>>
    login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/oauth/token")
    public ResponseEntity<ApiResponse<OAuthTokenResponse>>
    exchangeOAuthToken(@RequestBody OAuthCodeRequest request) {
        OAuthTokenResponse response = authService.exchangeOAuthCode(request.code());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<LoginResponse>>
    refresh(@Valid @RequestBody RefreshTokenRequest request) {
        LoginResponse response = authService.refreshToken(request.refreshToken());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @AuthenticationPrincipal Long userId,
            HttpServletRequest request) {
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String bearer = request.getHeader("Authorization");
        String accessToken = (bearer != null && bearer.startsWith("Bearer "))
                ? bearer.substring(7) : null;
        authService.logout(userId, accessToken);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/email/send")
    public ResponseEntity<ApiResponse<Void>>
    sendEmailCode(@Valid @RequestBody EmailSendRequest request) {
        emailVerificationService.sendCode(request.getEmail());
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/email/verify")
    public ResponseEntity<ApiResponse<Void>>
    verifyEmailCode(@Valid @RequestBody EmailVerifyRequest request) {
        emailVerificationService.verifyCode(request.getEmail(), request.getCode());
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/nickname/check")
    public ResponseEntity<ApiResponse<Boolean>>
    checkNickname(@RequestParam String nickname) {
        boolean available = authService.isNicknameAvailable(nickname);
        return ResponseEntity.ok(ApiResponse.success(available));
    }

    // 비밀번호
    @PostMapping("/password/forgot")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody PasswordForgotRequest request) {
        authService.forgotPassword(request.getEmail());
        return ResponseEntity.ok(ApiResponse.success());
    }

    @PostMapping("/password/reset")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody PasswordResetRequest request) {
        authService.resetPassword(request.getResetToken(), request.getNewPassword());
        return ResponseEntity.ok(ApiResponse.success());
    }

    @PostMapping("/password/change")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody PasswordChangeRequest request) {
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        authService.changePassword(userId, request.getCurrentPassword(), request.getNewPassword());
        return ResponseEntity.ok(ApiResponse.success());
    }


}
