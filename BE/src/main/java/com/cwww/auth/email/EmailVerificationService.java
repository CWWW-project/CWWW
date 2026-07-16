package com.cwww.auth.email;

public interface EmailVerificationService {
    void sendCode(String email);
    void verifyCode(String email, String code);
}
