package com.cwww.payment.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ResolveCancelRequest {
    /** COMPLETE(취소 확정) 또는 REVERT(PAID 복구) */
    private String action;
}
