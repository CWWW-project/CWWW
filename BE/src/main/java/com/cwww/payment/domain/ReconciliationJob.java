package com.cwww.payment.domain;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ReconciliationJob {
    private Long jobId;
    private Long orderId;
    private String operation;       // JobOperation
    private String status;          // JobStatus
    private int retryCount;
    private int maxRetries;
    private LocalDateTime nextAttemptAt;
    private LocalDateTime lockedAt;
    private String lastError;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
