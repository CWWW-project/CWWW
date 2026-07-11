package com.cwww.auth.service;

import com.cwww.auth.dto.SignupRequest;
import com.cwww.auth.dto.SignupResponse;

public interface AuthService {
    SignupResponse signup(SignupRequest request);
}
