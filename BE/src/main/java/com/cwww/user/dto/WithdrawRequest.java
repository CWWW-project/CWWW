package com.cwww.user.dto;

import jakarta.validation.constraints.NotBlank;
public record WithdrawRequest(@NotBlank String password) {}
