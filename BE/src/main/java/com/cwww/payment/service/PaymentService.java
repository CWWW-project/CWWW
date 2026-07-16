package com.cwww.payment.service;

import com.cwww.payment.dto.*;

import java.util.List;

public interface PaymentService {

    OrderCreateResponse createOrder(Long userId, int acornAmount);


    PaymentConfirmResponse confirmPayment(Long userId, PaymentConfirmRequest request);

    List<AcornHistoryResponse> getAcornHistory(Long userId, int page, int size);

    AcornBalanceResponse getBalance(Long userId);

    PaymentCancelResponse cancelPayment(Long userId, PaymentCancelRequest request);
}