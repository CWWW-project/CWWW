package com.cwww.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class SignupRequest {

    @NotBlank @Email
    private String email;

    @NotBlank
    @Pattern(regexp = "^(?=.*[a-zA-Z])(?=.*\\d).{8,20}$", message = "비밀번호는 영문+숫자 포함 8~20자여야 합니다.")
    private String password;

    @NotBlank
    @Size(min = 2, max = 20)
    private String nickname;
}
