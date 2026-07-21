package com.cwww.room.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class SaveAvatarRequest {

    private Long avatarInventoryId;

    // 기본 아바타를 선택한 경우 보유함 ID 대신 에셋 정보가 전달된다.
    private String assetKey;
    private String assetUrl;
    private Integer assetWidth;
    private Integer assetHeight;
    private Integer posX;
    private Integer posY;
    private BigDecimal scale = BigDecimal.ONE;
    private Boolean flipped = false;
}
