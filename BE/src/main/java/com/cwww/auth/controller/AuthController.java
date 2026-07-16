package com.cwww.auth.controller;


import com.cwww.auth.dto.LoginRequest;
import com.cwww.auth.dto.LoginResponse;
import com.cwww.auth.dto.OAuthCodeRequest;
import com.cwww.auth.dto.OAuthTokenResponse;
import com.cwww.auth.dto.SignupRequest;
import com.cwww.auth.dto.SignupResponse;
import com.cwww.auth.service.AuthService;
import com.cwww.global.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

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
}
