package com.cwww.payment.service;

import com.cwww.payment.domain.ReconciliationJob;
import com.cwww.payment.mapper.ReconciliationJobMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * ReconciliationScheduler 에서 트랜잭션이 필요한 짧은 작업 분리.
 * @Scheduled 메서드 내부에서 this.xxx() 호출 시 Spring AOP가 적용되지 않으므로
 * 별도 빈으로 추출하여 프록시를 통해 @Transactional 을 보장한다.
 */
@Slf4j
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

    /**
     * 완료 처리 — 낙관적 락으로 다른 워커 선점 감지
     * 0행 반환 시 다른 워커가 이미 처리한 것 → 경고 로그만 남기고 무시
     */
    @Transactional
    public void markDone(Long jobId, long version) {
        int rows = reconciliationJobMapper.markDone(jobId, version);
        if (rows == 0) {
            log.warn("markDone 적용 실패 — 다른 워커가 선점했거나 이미 처리됨: jobId={}", jobId);
        }
    }

    @Transactional
    public void markFailed(Long jobId, long version, String error) {
        int rows = reconciliationJobMapper.markFailed(jobId, version, error);
        if (rows == 0) {
            log.warn("markFailed 적용 실패 — 다른 워커가 선점했거나 이미 처리됨: jobId={}", jobId);
        }
    }

    @Transactional
    public void reschedule(Long jobId, long version, int retryCount, LocalDateTime nextAttemptAt, String error) {
        int rows = reconciliationJobMapper.reschedule(jobId, version, retryCount, nextAttemptAt, error);
        if (rows == 0) {
            log.warn("reschedule 적용 실패 — 다른 워커가 선점했거나 이미 처리됨: jobId={}", jobId);
        }
    }
}
