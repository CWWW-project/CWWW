package com.cwww.room.mapper;

import com.cwww.room.domain.Avatar;
import com.cwww.room.domain.MiniRoom;
import com.cwww.room.domain.MiniRoomItem;
import com.cwww.room.dto.AvatarResponse;
import com.cwww.room.dto.RoomItemResponse;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface RoomMapper {

    MiniRoom selectRoomByUserId(@Param("userId") Long userId);

    void insertRoom(MiniRoom miniRoom);

    void updateRoom(MiniRoom miniRoom);

    List<RoomItemResponse> selectRoomItems(@Param("roomId") Long roomId);

    void deleteRoomItems(@Param("roomId") Long roomId);

    void insertRoomItem(MiniRoomItem roomItem);

    Avatar selectAvatarByUserId(@Param("userId") Long userId);

    AvatarResponse selectAvatarResponseByUserId(@Param("userId") Long userId);

    void insertAvatar(Avatar avatar);

    void updateAvatar(Avatar avatar);

    int existsUserInventory(@Param("userId") Long userId, @Param("userInventoryId") Long userInventoryId);
}
