package com.cwww.item.domain;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class Item {

    private Long itemId;
    private String category;
    private String name;
    private String description;
    private Integer price;
    private String status;
    private String rejectReason;
    private Integer salesCount;
    private Long creatorId;
    private String assetKey;
    private String assetUrl;
    private Integer assetWidth;
    private Integer assetHeight;
    private String placementType;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
