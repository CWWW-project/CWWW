package com.cwww.payment.controller;

import com.cwww.global.response.ApiResponse;
import com.cwww.payment.dto.*;
import com.cwww.payment.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/orders")
    public ResponseEntity<ApiResponse<OrderCreateResponse>> createOrder(
            @AuthenticationPrincipal Long userId,
            @RequestBody OrderCreateRequest request) {
        OrderCreateResponse response = paymentService.createOrder(userId, request.getAcornAmount());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response));
    }

    @PostMapping("/confirm")
    public ResponseEntity<ApiResponse<PaymentConfirmResponse>> confirmPayment(
            @AuthenticationPrincipal Long userId,
           @Valid @RequestBody PaymentConfirmRequest request) {
        return ResponseEntity.ok(ApiResponse.success(paymentService.confirmPayment(userId, request)));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<AcornHistoryResponse>>> getAcornHistory(
            @AuthenticationPrincipal Long userId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(paymentService.getAcornHistory(userId, page, size)));
    }

    @GetMapping("/balance")
    public ResponseEntity<ApiResponse<AcornBalanceResponse>> getBalance(
            @AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(ApiResponse.success(paymentService.getBalance(userId)));
    }

    @GetMapping("/orders")
    public ResponseEntity<ApiResponse<List<OrderHistoryResponse>>> getOrderHistory(
            @AuthenticationPrincipal Long userId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(paymentService.getOrderHistory(userId, page, size)));
    }

    @PostMapping("/cancel")
    public ResponseEntity<ApiResponse<PaymentCancelResponse>> cancelPayment(
            @AuthenticationPrincipal Long userId,
           @Valid @RequestBody PaymentCancelRequest request) {
        return ResponseEntity.ok(ApiResponse.success(paymentService.cancelPayment(userId, request)));
    }
}
