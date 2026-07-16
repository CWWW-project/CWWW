package com.cwww.payment.service;

import com.cwww.payment.dto.*;

import java.util.List;

public interface PaymentService {

    OrderCreateResponse createOrder(Long userId, int acornAmount);


    PaymentConfirmResponse confirmPayment(Long userId, PaymentConfirmRequest request);

    List<AcornHistoryResponse> getAcornHistory(Long userId, int page, int size);

    AcornBalanceResponse getBalance(Long userId);

    String prepareCancel(Long userId, PaymentCancelRequest request);
    void revertCancelStatus(Long userId, PaymentCancelRequest request);
    PaymentCancelResponse completeCancel(Long userId, PaymentCancelRequest request);
}