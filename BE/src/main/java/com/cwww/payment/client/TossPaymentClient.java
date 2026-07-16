package com.cwww.payment.client;

import com.cwww.global.exception.BusinessException;
import com.cwww.global.exception.ErrorCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

@Slf4j
@Component
public class TossPaymentClient {

    private final RestClient restClient;

    public TossPaymentClient(@Value("${toss.secret-key}") String secretKey) {
        String encodedKey = Base64.getEncoder()
                .encodeToString((secretKey + ":").getBytes(StandardCharsets.UTF_8));
        this.restClient = RestClient.builder()
                .baseUrl("https://api.tosspayments.com")
                .defaultHeader("Authorization", "Basic " + encodedKey)
                .build();
    }

    public TossConfirmResponse confirm(String paymentKey, String orderUid, int amount) {
        try {
            return restClient.post()
                    .uri("/v1/payments/confirm")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(
                            "paymentKey", paymentKey,
                            "orderId", orderUid,
                            "amount", amount))
                    .retrieve()
                    .body(TossConfirmResponse.class);
        } catch (Exception e) {
            log.error("토스 결제 승인 실패: orderUid={}", orderUid, e);
            throw new BusinessException(ErrorCode.PAYMENT_CONFIRM_FAILED);
        }

    }

    public TossConfirmResponse cancel(String paymentKey, String reason) {
        try {
            return restClient.post()
                    .uri("/v1/payments/{paymentKey}/cancel", paymentKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("cancelReason", reason))
                    .retrieve()
                    .body(TossConfirmResponse.class);
        } catch (Exception e) {
            log.error("토스 결제 취소 실패: paymentKey={}", paymentKey, e);
            throw new BusinessException(ErrorCode.PAYMENT_CONFIRM_FAILED);
        }
    }

}