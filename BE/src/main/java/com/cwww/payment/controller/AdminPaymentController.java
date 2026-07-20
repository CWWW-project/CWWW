package com.cwww.payment.controller;

import com.cwww.payment.dto.AdminOrderDetailResponse;
import com.cwww.payment.dto.AdminOrderResponse;
import com.cwww.payment.dto.PaymentStatsResponse;
import com.cwww.payment.dto.ResolveCancelRequest;
import com.cwww.payment.service.AdminPaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 결제 도메인 관리자 API.
 *
 * TODO(인증): /api/admin/** 경로에 관리자 권한 체크가 걸려 있는지 확인 필요.
 *  - 시큐리티/인터셉터 설정은 auth 담당(주원님) 구조를 따를 것.
 *  - 관리자 role 판별 방식(users 테이블 role 컬럼 여부)을 확인하고 맞출 것.
 *
 * TODO(응답): 팀 공통 ApiResponse로 감싸는 방식이면 기존 PaymentController와
 *  동일한 형태로 반환부를 감싸주세요. (예: ApiResponse.success(...))
 */
@RestController
@RequestMapping("/api/admin/payments")
@RequiredArgsConstructor
public class AdminPaymentController {

    private final AdminPaymentService adminPaymentService;

    /** 주문 목록 조회 (상태 필터 + 페이징). status 미지정 시 전체 */
    @GetMapping("/orders")
    public List<AdminOrderResponse> getOrders(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return adminPaymentService.getOrders(status, page, size);
    }

    /** 주문 상세 조회 (주문 + 결제 기록) */
    @GetMapping("/orders/{orderUid}")
    public AdminOrderDetailResponse getOrderDetail(@PathVariable String orderUid) {
        return adminPaymentService.getOrderDetail(orderUid);
    }

    /** 매출 통계 (총 충전액/환불액, 상태별 주문 건수) */
    @GetMapping("/stats")
    public PaymentStatsResponse getStats() {
        return adminPaymentService.getStats();
    }

    /**
     * CANCELING 상태 보정.
     * 관리자가 토스 개발자센터에서 실제 취소 여부를 확인한 뒤 호출한다.
     * - action=COMPLETE : 토스에서 취소 확인됨 → 취소 확정(도토리 회수 + CANCELED)
     * - action=REVERT   : 토스에서 취소 안 됨 확인 → PAID로 복구
     */
    @PostMapping("/orders/{orderUid}/resolve-cancel")
    public AdminOrderDetailResponse resolveCancel(
            @PathVariable String orderUid,
            @RequestBody ResolveCancelRequest request) {
        return adminPaymentService.resolveCancel(orderUid, request.getAction());
    }
}