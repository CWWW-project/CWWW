package com.cwww.item.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;

import java.util.List;

@Getter
public class ItemPurchaseRequest {

    @NotEmpty
    private List<Long> itemIds;
}
