package com.cwww.room.domain;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
public class MiniRoomItem {

    private Long id;
    private Long miniRoomId;
    private Long userInventoryId;
    private Integer posX;
    private Integer posY;
    private Integer rotation;
    private Boolean flipped;
    private BigDecimal scale;
    private Integer sortOrder;
    private Boolean locked;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
