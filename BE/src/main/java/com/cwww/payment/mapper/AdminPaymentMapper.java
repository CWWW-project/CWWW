package com.cwww.payment.mapper;

import com.cwww.payment.dto.AdminOrderDetailResponse;
import com.cwww.payment.dto.AdminOrderResponse;
import com.cwww.payment.dto.PaymentStatsResponse;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface AdminPaymentMapper {

    List<AdminOrderResponse> findOrders(@Param("status") String status,
                                        @Param("size") int size,
                                        @Param("offset") long offset);

    AdminOrderDetailResponse findOrderDetail(@Param("orderUid") String orderUid);

    PaymentStatsResponse findStats();
}