package com.cwww.item.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class InventoryItemResponse {

    private Long inventoryId;
    private Long itemId;
    private String category;
    private String name;
    private String description;
    private Integer price;
    private String assetKey;
    private String assetUrl;
    private Integer assetWidth;
    private Integer assetHeight;
    private String placementType;
    private LocalDateTime acquiredAt;
}
