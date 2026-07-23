package com.cwww.room.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class SaveRoomItemRequest {

    private Long userInventoryId;

    // userInventoryId가 없는 기본 장식은 아래 스냅샷 정보로 저장한다.
    private String category;
    private String name;
    private String assetKey;
    private String assetUrl;
    private Integer assetWidth;
    private Integer assetHeight;
    private String placementType;

    private Integer posX;

    private Integer posY;

    private Integer rotation = 0;
    private Boolean flipped = false;
    private BigDecimal scale = BigDecimal.ONE;
    private Integer sortOrder = 0;
    private Boolean locked = false;
}
