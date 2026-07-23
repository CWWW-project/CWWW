package com.cwww.payment.mapper;

import com.cwww.payment.domain.ReconciliationJob;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;

@Mapper
public interface ReconciliationJobMapper {

    /** 보정 작업 생성 (활성 중복 시 DO NOTHING) */
    void insertJob(ReconciliationJob job);

    /**
     * 처리 대상 작업 1건 claim — FOR UPDATE SKIP LOCKED
     * lockedAt 5분 초과 시 다른 인스턴스가 재시도 가능
     */
    ReconciliationJob claimNextJob();

    /** PROCESSING으로 전이 + lockedAt 갱신 */
    void markProcessing(@Param("jobId") Long jobId);

    /**
     * 완료 처리 (낙관적 락 — version 불일치 시 0 반환)
     * 다른 워커가 선점한 경우 덮어쓰지 않음
     */
    int markDone(@Param("jobId") Long jobId, @Param("version") long version);

    /**
     * 최종 실패 처리 (낙관적 락 — version 불일치 시 0 반환)
     */
    int markFailed(@Param("jobId") Long jobId,
                   @Param("version") long version,
                   @Param("lastError") String lastError);

    /**
     * 재시도 예약 (낙관적 락 — version 불일치 시 0 반환)
     */
    int reschedule(@Param("jobId") Long jobId,
                   @Param("version") long version,
                   @Param("retryCount") int retryCount,
                   @Param("nextAttemptAt") LocalDateTime nextAttemptAt,
                   @Param("lastError") String lastError);

    /**
     * orderId + operation 기준으로 활성 잡(PENDING/PROCESSING)을 DONE 처리.
     * recoverOrderToPending / recoverOrderToPaid 시 함께 호출하여 잡을 닫는다.
     */
    void markDoneByOrderAndOperation(@Param("orderId") Long orderId,
                                     @Param("operation") String operation);
}
