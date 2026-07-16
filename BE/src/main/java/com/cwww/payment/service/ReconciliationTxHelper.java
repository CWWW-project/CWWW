package com.cwww.payment.service;

import com.cwww.payment.domain.ReconciliationJob;
import com.cwww.payment.mapper.ReconciliationJobMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * ReconciliationScheduler 에서 트랜잭션이 필요한 짧은 작업 분리.
 * @Scheduled 메서드 내부에서 this.xxx() 호출 시 Spring AOP가 적용되지 않으므로
 * 별도 빈으로 추출하여 프록시를 통해 @Transactional 을 보장한다.
 */
@Component
@RequiredArgsConstructor
public class ReconciliationTxHelper {

    private final ReconciliationJobMapper reconciliationJobMapper;

    /** FOR UPDATE SKIP LOCKED 로 작업 1건 claim + PROCESSING 전이 (한 TX) */
    @Transactional
    public ReconciliationJob claimNextJob() {
        ReconciliationJob job = reconciliationJobMapper.claimNextJob();
        if (job != null) {
            reconciliationJobMapper.markProcessing(job.getJobId());
        }
        return job;
    }

    @Transactional
    public void markDone(Long jobId) {
        reconciliationJobMapper.markDone(jobId);
    }

    @Transactional
    public void markFailed(Long jobId, String error) {
        reconciliationJobMapper.markFailed(jobId, error);
    }

    @Transactional
    public void reschedule(Long jobId, int retryCount, LocalDateTime nextAttemptAt, String error) {
        reconciliationJobMapper.reschedule(jobId, retryCount, nextAttemptAt, error);
    }
}
