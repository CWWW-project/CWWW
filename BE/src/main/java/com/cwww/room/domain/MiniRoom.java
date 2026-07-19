package com.cwww.room.domain;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class MiniRoom {

    private Long id;
    private Long userId;
    private Long backgroundInventoryId;
    private String backgroundAssetKey;
    private String backgroundAssetUrl;
    private Integer maxItemCount;
    private Integer layoutVersion;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
