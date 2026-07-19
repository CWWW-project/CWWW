package com.cwww.room.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class RoomItemResponse {

    private Long roomItemId;
    private Long userInventoryId;
    private Long itemId;
    private String category;
    private String name;
    private String description;
    private String assetKey;
    private String assetUrl;
    private Integer assetWidth;
    private Integer assetHeight;
    private String placementType;
    private Integer posX;
    private Integer posY;
    private Integer rotation;
    private Boolean flipped;
    private BigDecimal scale;
    private Integer sortOrder;
    private Boolean locked;
}
