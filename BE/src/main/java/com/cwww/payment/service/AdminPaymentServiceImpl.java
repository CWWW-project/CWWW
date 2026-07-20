package com.cwww.payment.service;

import com.cwww.global.exception.BusinessException;
import com.cwww.global.exception.ErrorCode;
import com.cwww.payment.domain.AcornTxReason;
import com.cwww.payment.domain.AcornWallet;
import com.cwww.payment.domain.Order;
import com.cwww.payment.domain.OrderStatus;
import com.cwww.payment.dto.AdminOrderDetailResponse;
import com.cwww.payment.dto.AdminOrderResponse;
import com.cwww.payment.dto.PaymentStatsResponse;
import com.cwww.payment.mapper.AdminPaymentMapper;
import com.cwww.payment.mapper.PaymentMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminPaymentServiceImpl implements AdminPaymentService {

    private static final int MAX_PAGE_SIZE = 100;

    private final AdminPaymentMapper adminPaymentMapper;
    private final PaymentMapper paymentMapper;

    @Override
    public List<AdminOrderResponse> getOrders(String status, int page, int size) {
        if (page < 1 || size < 1 || size > MAX_PAGE_SIZE) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
        if (status != null && !status.isBlank()) {
            // 오타로 조용히 빈 결과가 나오는 것 방지
            try {
                OrderStatus.valueOf(status);
            } catch (IllegalArgumentException e) {
                throw new BusinessException(ErrorCode.INVALID_INPUT);
            }
        } else {
            status = null;
        }
        long offset = (long) (page - 1) * size;
        return adminPaymentMapper.findOrders(status, size, offset);
    }

    @Override
    public AdminOrderDetailResponse getOrderDetail(String orderUid) {
        AdminOrderDetailResponse detail = adminPaymentMapper.findOrderDetail(orderUid);
        if (detail == null) {
            throw new BusinessException(ErrorCode.ORDER_NOT_FOUND);
        }
        return detail;
    }

    @Override
    public PaymentStatsResponse getStats() {
        return adminPaymentMapper.findStats();
    }

    /**
     * CANCELING 상태 보정 (토스 취소 결과 불확실 케이스의 최종 처리).
     * 관리자가 토스 개발자센터에서 실제 취소 여부를 확인한 뒤 호출한다.
     *
     * - REVERT   : 토스에서 취소 안 됨 확인 → 예약 해제 + PAID 복구 (CAS로 안전 전이)
     * - COMPLETE : 토스에서 취소 확인 → 도토리 회수 + 예약 해제 + CANCELED 확정
     *   releaseReservation은 GREATEST(...,0) 처리라 예약이 없던 주문에 호출해도 무해하다.
     *   원장은 insertAcornTransactionIdempotent(멱등 삽입)를 사용:
     *   반환 0 = 이미 REFUND 원장이 존재 → 지갑 차감을 건너뛰어 이중 회수를 방지한다.
     */
    @Override
    @Transactional
    public AdminOrderDetailResponse resolveCancel(String orderUid, String action) {
        Order order = paymentMapper.findOrderByUidForUpdate(orderUid);
        if (order == null) {
            throw new BusinessException(ErrorCode.ORDER_NOT_FOUND);
        }
        if (!OrderStatus.CANCELING.name().equals(order.getStatus())) {
            throw new BusinessException(ErrorCode.CANCEL_NOT_ALLOWED);
        }

        if ("REVERT".equals(action)) {
            // 취소가 무산됐으므로 환불 예약 해제 후 PAID 복구
            paymentMapper.releaseReservation(order.getUserId(), order.getAcornAmount());
            paymentMapper.updateOrderStatusCas(order.getOrderId(),
                    OrderStatus.CANCELING.name(), OrderStatus.PAID.name());
            log.info("관리자 보정: CANCELING → PAID 복구. orderUid={}", orderUid);

        } else if ("COMPLETE".equals(action)) {
            AcornWallet wallet = paymentMapper.findWalletForUpdate(order.getUserId());
            if (wallet == null || wallet.getBalance() < order.getAcornAmount()) {
                // 도토리를 이미 사용해 회수 불가 → CANCELING 유지, 정책 판단 필요 케이스로 남김
                throw new BusinessException(ErrorCode.REFUND_INSUFFICIENT_BALANCE);
            }
            int balanceAfter = wallet.getBalance() - order.getAcornAmount();

            // 원장 멱등 삽입: (ref_id, reason) 유니크 제약으로 중복 방지
            int inserted = paymentMapper.insertAcornTransactionIdempotent(
                    order.getUserId(), -order.getAcornAmount(), balanceAfter,
                    AcornTxReason.REFUND.name(), order.getOrderId());
            if (inserted == 1) {
                paymentMapper.addWalletBalance(order.getUserId(), -order.getAcornAmount());
            } else {
                // 이미 환불 원장이 있음(다른 경로에서 반영 완료) → 지갑 이중 차감 방지
                log.warn("REFUND 원장이 이미 존재하여 지갑 차감 생략. orderUid={}", orderUid);
            }

            // 취소 확정: 환불 예약 해제 + 결제/주문 상태 확정
            paymentMapper.releaseReservation(order.getUserId(), order.getAcornAmount());
            paymentMapper.updatePaymentPgStatus(order.getOrderId(), "CANCELED", null);
            paymentMapper.updateOrderStatusCas(order.getOrderId(),
                    OrderStatus.CANCELING.name(), OrderStatus.CANCELED.name());
            log.info("관리자 보정: CANCELING → CANCELED 확정. orderUid={}", orderUid);

        } else {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }

        return adminPaymentMapper.findOrderDetail(orderUid);
    }
}