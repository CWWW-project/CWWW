package com.cwww.payment.service;

import com.cwww.payment.dto.AdminOrderDetailResponse;
import com.cwww.payment.dto.AdminOrderResponse;
import com.cwww.payment.dto.PaymentStatsResponse;

import java.util.List;

public interface AdminPaymentService {

    List<AdminOrderResponse> getOrders(String status, int page, int size);

    AdminOrderDetailResponse getOrderDetail(String orderUid);

    PaymentStatsResponse getStats();

    AdminOrderDetailResponse resolveCancel(String orderUid, String action);
}