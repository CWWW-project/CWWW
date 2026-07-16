package com.cwww.payment.mapper;

import com.cwww.payment.domain.AcornWallet;
import com.cwww.payment.domain.Order;
import com.cwww.payment.dto.AcornHistoryResponse;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface PaymentMapper {

    void insertOrder(Order order);

    Order findOrderByUidForUpdate(@Param("orderUid") String orderUid);

    void updateOrderStatus(@Param("orderId") Long orderId, @Param("status") String status);

    void insertPayment(@Param("orderId") Long orderId,
                       @Param("pgTxId") String pgTxId,
                       @Param("method") String method,
                       @Param("amount") int amount,
                       @Param("status") String status);

    AcornWallet findWalletForUpdate(@Param("userId") Long userId);

    void insertWallet(@Param("userId") Long userId);

    void addWalletBalance(@Param("userId") Long userId, @Param("amount") int amount);

    void insertAcornTransaction(@Param("userId") Long userId,
                                @Param("amount") int amount,
                                @Param("balanceAfter") int balanceAfter,
                                @Param("reason") String reason,
                                @Param("refId") Long refId);


    List<AcornHistoryResponse> findAcornHistory(@Param("userId") Long userId,
                                                @Param("size") int size,
                                                @Param("offset") long offset);


    AcornWallet findWalletByUserId(@Param("userId") Long userId);

    String findPgTxIdByOrderId(@Param("orderId") Long orderId);

    void updatePaymentStatus(@Param("orderId") Long orderId, @Param("status") String status);

}