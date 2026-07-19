package com.cwww.item.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PurchaseResponse {

    private Long purchaseId;
    private Long inventoryId;
    private Integer remainingAcorns;
}
