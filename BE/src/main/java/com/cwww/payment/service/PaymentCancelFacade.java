package com.cwww.payment.service;

import com.cwww.payment.client.TossPaymentClient;
import com.cwww.payment.dto.PaymentCancelRequest;
import com.cwww.payment.dto.PaymentCancelResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * 결제 취소 흐름 조율 클래스 (트랜잭션 없음 — 의도적).
 *
 * 외부 API(토스) 호출을 DB 트랜잭션 밖에서 수행하여
 * "토스는 취소됐는데 DB는 PAID" 불일치와
 * FOR UPDATE 락을 잡은 채 HTTP 응답을 기다리는 문제를 제거한다.
 *
 * 흐름: [1] 짧은 트랜잭션(검증 + CANCELING 마킹)
 *      → [2] 트랜잭션 밖에서 토스 취소 호출
 *      → [3] 짧은 트랜잭션(내부 상태 갱신)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentCancelFacade {

    private final PaymentService paymentService;
    private final TossPaymentClient tossPaymentClient;

    public PaymentCancelResponse cancelPayment(Long userId, PaymentCancelRequest request) {

        // [1] 검증 + PAID → CANCELING 마킹 (커밋되면서 중복 취소 요청 차단)
        String pgTxId = paymentService.prepareCancel(userId, request);

        String reason = (request.getReason() == null || request.getReason().isBlank())
                ? "사용자 요청 취소" : request.getReason();

        // [2] 트랜잭션 밖: 토스 취소 호출 (락/DB 커넥션 점유 없음)
        try {
            tossPaymentClient.cancel(pgTxId, reason);
        } catch (RuntimeException e) {
            // 토스 취소 실패 → CANCELING을 PAID로 원복해 재시도 가능하게
            log.warn("토스 취소 호출 실패, 주문 상태 복구. userId={}, orderUid={}",
                    userId, request.getOrderUid(), e);
            paymentService.revertCancelStatus(userId, request);
            throw e;
        }

        // [3] 내부 상태 갱신 (짧은 트랜잭션)
        try {
            return paymentService.completeCancel(userId, request);
        } catch (RuntimeException e) {
            // 토스는 취소 완료, DB 갱신만 실패한 상태.
            // 주문이 CANCELING으로 남아 있으므로 이 로그를 근거로 수동/배치 보정 가능.
            log.error("토스 취소 성공 후 내부 상태 갱신 실패 - 보정 필요. userId={}, orderUid={}, pgTxId={}",
                    userId, request.getOrderUid(), pgTxId, e);
            throw e;
        }
    }
}