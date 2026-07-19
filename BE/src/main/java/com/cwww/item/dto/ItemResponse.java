package com.cwww.item.dto;

import com.cwww.item.domain.Item;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ItemResponse {

    private Long itemId;
    private String category;
    private String name;
    private String description;
    private Integer price;
    private String status;
    private Integer salesCount;
    private Long creatorId;
    private String assetKey;
    private String assetUrl;
    private Integer assetWidth;
    private Integer assetHeight;
    private String placementType;

    public static ItemResponse from(Item item) {
        return ItemResponse.builder()
                .itemId(item.getItemId())
                .category(item.getCategory())
                .name(item.getName())
                .description(item.getDescription())
                .price(item.getPrice())
                .status(item.getStatus())
                .salesCount(item.getSalesCount())
                .creatorId(item.getCreatorId())
                .assetKey(item.getAssetKey())
                .assetUrl(item.getAssetUrl())
                .assetWidth(item.getAssetWidth())
                .assetHeight(item.getAssetHeight())
                .placementType(item.getPlacementType())
                .build();
    }
}
