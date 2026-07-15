package com.cwww.payment.service;

import com.cwww.payment.dto.AcornHistoryResponse;
import com.cwww.payment.dto.OrderCreateResponse;
import com.cwww.payment.dto.PaymentConfirmRequest;
import com.cwww.payment.dto.PaymentConfirmResponse;

import java.util.List;

public interface PaymentService {

    OrderCreateResponse createOrder(Long userId, int acornAmount);


    PaymentConfirmResponse confirmPayment(Long userId, PaymentConfirmRequest request);

    List<AcornHistoryResponse> getAcornHistory(Long userId, int page, int size);
}