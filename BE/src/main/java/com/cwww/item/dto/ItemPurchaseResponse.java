package com.cwww.item.dto;

import com.cwww.item.domain.Item;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class ItemPurchaseResponse {
    private List<Item> purchasedItems;
    private int balance;
    private int availableBalance;
}
