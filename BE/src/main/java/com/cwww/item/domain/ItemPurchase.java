package com.cwww.item.domain;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class ItemPurchase {

    private Long purchaseId;
    private Long userId;
    private Long itemId;
    private Long paymentId;
    private Integer acornPrice;
    private String status;
    private LocalDateTime createdAt;
}
