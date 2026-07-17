package com.cwww.payment.mapper;

import com.cwww.payment.domain.AcornWallet;
import com.cwww.payment.domain.Order;
import com.cwww.payment.dto.AcornHistoryResponse;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface PaymentMapper {

    // ── 주문 ────────────────────────────────────────────────────────────────

    void insertOrder(Order order);

    Order findOrderByUidForUpdate(@Param("orderUid") String orderUid);

    Order findOrderByIdForUpdate(@Param("orderId") Long orderId);

    Order findOrderById(@Param("orderId") Long orderId);

    void updateOrderStatus(@Param("orderId") Long orderId, @Param("status") String status);

    /**
     * CAS 업데이트 — fromStatus와 일치할 때만 전이 (중복 처리 방지)
     * 반환값: 실제 갱신된 행 수 (0=전이 불가 상태, 1=성공)
     */
    int updateOrderStatusCas(@Param("orderId") Long orderId,
                             @Param("fromStatus") String fromStatus,
                             @Param("toStatus") String toStatus);

    // ── 결제 ────────────────────────────────────────────────────────────────

    /**
     * 멱등 삽입 — uidx_payment_order_id 충돌 시 DO NOTHING
     * (PG 성공 후 내부 처리 재시도 시 중복 기록 방지)
     */
    void insertPaymentIdempotent(@Param("orderId") Long orderId,
                                 @Param("pgTxId") String pgTxId,
                                 @Param("method") String method,
                                 @Param("amount") int amount,
                                 @Param("pgStatus") String pgStatus,
                                 @Param("userId") Long userId);

    void updatePaymentPgStatus(@Param("orderId") Long orderId,
                               @Param("pgStatus") String pgStatus,
                               @Param("failureCode") String failureCode);

    String findPgTxIdByOrderId(@Param("orderId") Long orderId);

    // ── 지갑 ────────────────────────────────────────────────────────────────

    AcornWallet findWalletForUpdate(@Param("userId") Long userId);

    AcornWallet findWalletByUserId(@Param("userId") Long userId);

    /** 신규 사용자 지갑 생성 — ON CONFLICT DO NOTHING (race condition 해결) */
    void upsertWallet(@Param("userId") Long userId);

    void addWalletBalance(@Param("userId") Long userId, @Param("amount") int amount);

    /** CANCELING 전환 시 환불 예정 금액 예약 (reserved_balance += amount) */
    void reserveBalance(@Param("userId") Long userId, @Param("amount") int amount);

    /** 취소 완료/복구 시 예약 해제 — GREATEST(reserved_balance - amount, 0) 로 음수 방지 */
    void releaseReservation(@Param("userId") Long userId, @Param("amount") int amount);

    // ── 원장 ────────────────────────────────────────────────────────────────

    /**
     * 멱등 삽입 — uidx_acorn_tx_ref_reason 충돌 시 DO NOTHING
     * 반환값: 실제로 삽입된 행 수 (0=이미 존재, 1=신규 삽입)
     */
    int insertAcornTransactionIdempotent(@Param("userId") Long userId,
                                         @Param("amount") int amount,
                                         @Param("balanceAfter") int balanceAfter,
                                         @Param("reason") String reason,
                                         @Param("refId") Long refId);

    List<AcornHistoryResponse> findAcornHistory(@Param("userId") Long userId,
                                                @Param("size") int size,
                                                @Param("offset") long offset);

    /** USE 원장 삽입 — 아이템 구매 (ref_id 없음, 단순 삽입) */
    void insertAcornTransactionUse(@Param("userId") Long userId,
                                   @Param("amount") int amount,
                                   @Param("balanceAfter") int balanceAfter);
}
