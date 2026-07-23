package com.cwww.payment.client;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpRequest;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

@Slf4j
@Component
public class TossPaymentClient {

    private static final int CONNECT_TIMEOUT_MS = 5_000;
    private static final int READ_TIMEOUT_MS    = 30_000;

    private final RestClient restClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public TossPaymentClient(@Value("${toss.secret-key}") String secretKey) {
        String encoded = Base64.getEncoder()
                .encodeToString((secretKey + ":").getBytes(StandardCharsets.UTF_8));

        this.restClient = RestClient.builder()
                .baseUrl("https://api.tosspayments.com")
                .defaultHeader("Authorization", "Basic " + encoded)
                .requestFactory(requestFactory())
                .build();
    }

    /** 결제 승인 */
    public TossConfirmResponse confirm(String paymentKey, String orderUid, int amount) {
        try {
            return restClient.post()
                    .uri("/v1/payments/confirm")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("paymentKey", paymentKey, "orderId", orderUid, "amount", amount))
                    .retrieve()
                    .onStatus(HttpStatusCode::is4xxClientError, this::handle4xx)
                    .onStatus(HttpStatusCode::is5xxServerError, this::handle5xx)
                    .body(TossConfirmResponse.class);
        } catch (TossBusinessException | TossUncertainException e) {
            throw e;
        } catch (ResourceAccessException e) {
            log.warn("토스 승인 연결 오류: orderUid={}", orderUid, e);
            throw new TossUncertainException("연결 오류: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("토스 승인 알 수 없는 오류: orderUid={}", orderUid, e);
            throw new TossUncertainException("알 수 없는 오류: " + e.getMessage(), e);
        }
    }

    /** 결제 취소 */
    public TossCancelResponse cancel(String paymentKey, String reason) {
        try {
            return restClient.post()
                    .uri("/v1/payments/{paymentKey}/cancel", paymentKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("cancelReason", reason))
                    .retrieve()
                    .onStatus(HttpStatusCode::is4xxClientError, this::handle4xx)
                    .onStatus(HttpStatusCode::is5xxServerError, this::handle5xx)
                    .body(TossCancelResponse.class);
        } catch (TossBusinessException | TossUncertainException e) {
            throw e;
        } catch (ResourceAccessException e) {
            log.warn("토스 취소 연결 오류: paymentKey={}", paymentKey, e);
            throw new TossUncertainException("연결 오류: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("토스 취소 알 수 없는 오류: paymentKey={}", paymentKey, e);
            throw new TossUncertainException("알 수 없는 오류: " + e.getMessage(), e);
        }
    }

    /** 결제 상태 조회 (보정 스케줄러용) */
    public TossPaymentResponse getPayment(String paymentKey) {
        try {
            return restClient.get()
                    .uri("/v1/payments/{paymentKey}", paymentKey)
                    .retrieve()
                    .onStatus(HttpStatusCode::is4xxClientError, this::handle4xx)
                    .onStatus(HttpStatusCode::is5xxServerError, this::handle5xx)
                    .body(TossPaymentResponse.class);
        } catch (TossBusinessException | TossUncertainException e) {
            throw e;
        } catch (ResourceAccessException e) {
            log.warn("토스 상태 조회 연결 오류: paymentKey={}", paymentKey, e);
            throw new TossUncertainException("연결 오류: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("토스 상태 조회 알 수 없는 오류: paymentKey={}", paymentKey, e);
            throw new TossUncertainException("알 수 없는 오류: " + e.getMessage(), e);
        }
    }

    private void handle4xx(HttpRequest request, ClientHttpResponse response) throws IOException {
        int statusCode = response.getStatusCode().value();
        // 408(Request Timeout), 429(Too Many Requests)는 일시적 오류 — 재시도 대상
        if (statusCode == 408 || statusCode == 429) {
            String body = new String(response.getBody().readAllBytes(), StandardCharsets.UTF_8);
            log.warn("토스 재시도 가능 4xx: status={}, body={}", statusCode, body);
            throw new TossUncertainException("HTTP_" + statusCode + ": " + body, null);
        }
        String body = new String(response.getBody().readAllBytes(), StandardCharsets.UTF_8);
        log.warn("토스 4xx 오류: {}", body);
        try {
            TossErrorResponse err = objectMapper.readValue(body, TossErrorResponse.class);
            throw new TossBusinessException(err.getCode(), err.getMessage());
        } catch (TossBusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new TossBusinessException("UNKNOWN", body);
        }
    }

    private void handle5xx(HttpRequest request, ClientHttpResponse response) throws IOException {
        String body = new String(response.getBody().readAllBytes(), StandardCharsets.UTF_8);
        log.error("토스 5xx 오류: {}", body);
        throw new TossUncertainException("PG 5xx 오류: " + body, null);
    }

    private ClientHttpRequestFactory requestFactory() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(CONNECT_TIMEOUT_MS);
        factory.setReadTimeout(READ_TIMEOUT_MS);
        return factory;
    }
}
