package com.cwww.room.dto;

import jakarta.validation.Valid;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class SaveRoomRequest {

    private Long backgroundInventoryId;
    private String backgroundAssetKey;
    private String backgroundAssetUrl;

    @Valid
    private List<SaveRoomItemRequest> items = new ArrayList<>();

    @Valid
    private SaveAvatarRequest avatar;
}
