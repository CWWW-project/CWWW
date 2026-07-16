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

    /** 완료 처리 */
    void markDone(@Param("jobId") Long jobId);

    /** 최종 실패 처리 */
    void markFailed(@Param("jobId") Long jobId, @Param("lastError") String lastError);

    /** 재시도 예약 */
    void reschedule(@Param("jobId") Long jobId,
                    @Param("retryCount") int retryCount,
                    @Param("nextAttemptAt") LocalDateTime nextAttemptAt,
                    @Param("lastError") String lastError);
}
