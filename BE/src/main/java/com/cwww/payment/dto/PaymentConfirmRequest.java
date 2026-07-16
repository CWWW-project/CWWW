package com.cwww.payment.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public class PaymentConfirmRequest {

    @NotBlank(message = "paymentKey는 필수입니다.")
    private String paymentKey;

    @NotBlank(message = "orderUid는 필수입니다.")
    private String orderUid;

    @Min(value = 1, message = "amount는 1 이상이어야 합니다.")
    private int amount;
}
