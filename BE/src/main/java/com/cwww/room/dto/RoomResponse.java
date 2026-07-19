package com.cwww.room.dto;

import com.cwww.room.domain.MiniRoom;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class RoomResponse {

    private Long roomId;
    private Long userId;
    private Long backgroundInventoryId;
    private String backgroundAssetKey;
    private String backgroundAssetUrl;
    private Integer maxItemCount;
    private Integer layoutVersion;
    private AvatarResponse avatar;
    private List<RoomItemResponse> items;

    public static RoomResponse of(MiniRoom room, AvatarResponse avatar, List<RoomItemResponse> items) {
        return RoomResponse.builder()
                .roomId(room.getId())
                .userId(room.getUserId())
                .backgroundInventoryId(room.getBackgroundInventoryId())
                .backgroundAssetKey(room.getBackgroundAssetKey())
                .backgroundAssetUrl(room.getBackgroundAssetUrl())
                .maxItemCount(room.getMaxItemCount())
                .layoutVersion(room.getLayoutVersion())
                .avatar(avatar)
                .items(items)
                .build();
    }
}
