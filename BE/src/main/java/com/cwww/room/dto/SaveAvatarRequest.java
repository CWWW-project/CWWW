package com.cwww.room.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class SaveAvatarRequest {

    private Long avatarInventoryId;
    private Integer posX;
    private Integer posY;
    private BigDecimal scale = BigDecimal.ONE;
    private Boolean flipped = false;
}
