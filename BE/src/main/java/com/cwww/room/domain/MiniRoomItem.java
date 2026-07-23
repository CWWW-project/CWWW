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

    // 기본 장식처럼 보유함을 거치지 않는 아이템도 다시 그릴 수 있도록 저장 당시 정보를 남긴다.
    private String snapshotCategory;
    private String snapshotName;
    private String snapshotAssetKey;
    private String snapshotAssetUrl;
    private Integer snapshotAssetWidth;
    private Integer snapshotAssetHeight;
    private String snapshotPlacementType;
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
