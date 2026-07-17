package com.cwww.cart.dto;

import com.cwww.item.dto.PurchaseResponse;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class CartPurchaseResponse {

    private Integer totalPrice;
    private Integer remainingAcorns;
    private List<PurchaseResponse> purchasedItems;
}
