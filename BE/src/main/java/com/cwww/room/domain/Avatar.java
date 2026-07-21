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

    // 기본 아바타는 보유함 ID가 없어서 화면 복원에 필요한 에셋 정보를 함께 보관한다.
    private String snapshotAssetKey;
    private String snapshotAssetUrl;
    private Integer snapshotAssetWidth;
    private Integer snapshotAssetHeight;
    private Integer posX;
    private Integer posY;
    private BigDecimal scale;
    private Boolean flipped;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
