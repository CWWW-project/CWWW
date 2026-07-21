package com.cwww.room.dto;

import com.cwww.room.domain.Avatar;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AvatarResponse {

    private Long avatarId;
    private Long avatarInventoryId;
    private String assetKey;
    private String assetUrl;
    private Integer assetWidth;
    private Integer assetHeight;
    private Integer posX;
    private Integer posY;
    private BigDecimal scale;
    private Boolean flipped;

    public static AvatarResponse from(Avatar avatar) {
        if (avatar == null) {
            return null;
        }

        return AvatarResponse.builder()
                .avatarId(avatar.getId())
                .avatarInventoryId(avatar.getAvatarInventoryId())
                .posX(avatar.getPosX())
                .posY(avatar.getPosY())
                .scale(avatar.getScale())
                .flipped(avatar.getFlipped())
                .build();
    }
}
