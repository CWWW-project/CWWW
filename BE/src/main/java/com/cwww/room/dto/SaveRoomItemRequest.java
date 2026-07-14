package com.cwww.room.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class SaveRoomItemRequest {

    @NotNull
    private Long userInventoryId;

    @NotNull
    private Integer posX;

    @NotNull
    private Integer posY;

    private Integer rotation = 0;
    private Boolean flipped = false;
    private BigDecimal scale = BigDecimal.ONE;
    private Integer sortOrder = 0;
    private Boolean locked = false;
}
