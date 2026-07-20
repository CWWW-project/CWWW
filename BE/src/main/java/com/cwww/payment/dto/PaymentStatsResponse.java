package com.cwww.payment.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PaymentStatsResponse {
    private long totalChargedAcorn;   // 누적 충전 도토리 (CHARGE 합)
    private long totalRefundedAcorn;  // 누적 환불 도토리 (REFUND 합, 양수로 표현)
    private long totalSalesAmount;    // 누적 매출 원화 (PAID+CANCELED 주문 price 합에서 취소분 제외)
    private long pendingCount;        // PENDING 주문 수
    private long paidCount;           // PAID 주문 수
    private long cancelingCount;      // CANCELING 주문 수 (보정 대상!)
    private long canceledCount;       // CANCELED 주문 수
}
