package com.cwww.room.dto;

import com.cwww.room.domain.Avatar;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class AvatarResponse {

    private Long avatarId;
    private Long avatarInventoryId;
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
