package com.cwww.room.domain;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
public class Avatar {

    private Long id;
    private Long userId;
    private Long avatarInventoryId;
    private Integer posX;
    private Integer posY;
    private BigDecimal scale;
    private Boolean flipped;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
