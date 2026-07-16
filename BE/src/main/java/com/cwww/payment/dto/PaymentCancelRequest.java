package com.cwww.payment.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public class PaymentCancelRequest {

    @NotBlank(message = "orderUid는 필수입니다.")
    private String orderUid;

    private String reason;   // 선택 입력이라 검증 없음
}