package com.cwww.room.service;

import com.cwww.global.exception.BusinessException;
import com.cwww.global.exception.ErrorCode;
import com.cwww.room.domain.Avatar;
import com.cwww.room.domain.MiniRoom;
import com.cwww.room.domain.MiniRoomItem;
import com.cwww.room.dto.AvatarResponse;
import com.cwww.room.dto.RoomItemResponse;
import com.cwww.room.dto.RoomResponse;
import com.cwww.room.dto.SaveAvatarRequest;
import com.cwww.room.dto.SaveRoomItemRequest;
import com.cwww.room.dto.SaveRoomRequest;
import com.cwww.room.mapper.RoomMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RoomServiceImpl implements RoomService {

    private static final int DEFAULT_MAX_ITEM_COUNT = 50;

    private final RoomMapper roomMapper;

    @Override
    @Transactional(readOnly = true)
    public RoomResponse getRoom(Long userId) {
        validateUserId(userId);
        MiniRoom room = roomMapper.selectRoomByUserId(userId);
        if (room == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND);
        }

        return buildRoomResponse(room);
    }

    @Override
    @Transactional
    public RoomResponse saveRoom(Long userId, SaveRoomRequest request) {
        validateUserId(userId);
        if (request == null) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }

        MiniRoom room = roomMapper.selectRoomByUserId(userId);
        if (room == null) {
            room = new MiniRoom();
            room.setUserId(userId);
            room.setBackgroundAssetKey(defaultValue(request.getBackgroundAssetKey(), "room-pink"));
            room.setBackgroundAssetUrl(defaultValue(request.getBackgroundAssetUrl(), "/miniroom-assets/rooms/room-pink.svg"));
            roomMapper.insertRoom(room);
            room.setMaxItemCount(DEFAULT_MAX_ITEM_COUNT);
        }

        validateItemCount(room, request);
        validateInventoryOwnership(userId, request);
        updateRoom(room, request);
        saveRoomItems(room.getId(), request.getItems());
        saveAvatar(userId, request.getAvatar());

        MiniRoom savedRoom = roomMapper.selectRoomByUserId(userId);
        return buildRoomResponse(savedRoom);
    }

    private RoomResponse buildRoomResponse(MiniRoom room) {
        List<RoomItemResponse> items = roomMapper.selectRoomItems(room.getId());
        Avatar avatar = roomMapper.selectAvatarByUserId(room.getUserId());
        return RoomResponse.of(room, AvatarResponse.from(avatar), items);
    }

    private void updateRoom(MiniRoom room, SaveRoomRequest request) {
        room.setBackgroundInventoryId(request.getBackgroundInventoryId());
        room.setBackgroundAssetKey(defaultValue(request.getBackgroundAssetKey(), room.getBackgroundAssetKey()));
        room.setBackgroundAssetUrl(defaultValue(request.getBackgroundAssetUrl(), room.getBackgroundAssetUrl()));
        roomMapper.updateRoom(room);
    }

    private void saveRoomItems(Long roomId, List<SaveRoomItemRequest> items) {
        roomMapper.deleteRoomItems(roomId);
        if (items == null || items.isEmpty()) {
            return;
        }

        for (SaveRoomItemRequest itemRequest : items) {
            MiniRoomItem item = new MiniRoomItem();
            item.setMiniRoomId(roomId);
            item.setUserInventoryId(itemRequest.getUserInventoryId());
            item.setPosX(itemRequest.getPosX());
            item.setPosY(itemRequest.getPosY());
            item.setRotation(defaultValue(itemRequest.getRotation(), 0));
            item.setFlipped(defaultValue(itemRequest.getFlipped(), false));
            item.setScale(itemRequest.getScale());
            item.setSortOrder(defaultValue(itemRequest.getSortOrder(), 0));
            item.setLocked(defaultValue(itemRequest.getLocked(), false));
            roomMapper.insertRoomItem(item);
        }
    }

    private void saveAvatar(Long userId, SaveAvatarRequest request) {
        if (request == null) {
            return;
        }

        Avatar avatar = roomMapper.selectAvatarByUserId(userId);
        if (avatar == null) {
            avatar = new Avatar();
            avatar.setUserId(userId);
            avatar.setAvatarInventoryId(request.getAvatarInventoryId());
            avatar.setPosX(request.getPosX());
            avatar.setPosY(request.getPosY());
            avatar.setScale(request.getScale());
            avatar.setFlipped(defaultValue(request.getFlipped(), false));
            roomMapper.insertAvatar(avatar);
            return;
        }

        avatar.setAvatarInventoryId(request.getAvatarInventoryId());
        avatar.setPosX(request.getPosX());
        avatar.setPosY(request.getPosY());
        avatar.setScale(request.getScale());
        avatar.setFlipped(defaultValue(request.getFlipped(), false));
        roomMapper.updateAvatar(avatar);
    }

    private void validateInventoryOwnership(Long userId, SaveRoomRequest request) {
        if (request.getBackgroundInventoryId() != null
                && roomMapper.existsUserInventory(userId, request.getBackgroundInventoryId()) == 0) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        if (request.getAvatar() != null
                && request.getAvatar().getAvatarInventoryId() != null
                && roomMapper.existsUserInventory(userId, request.getAvatar().getAvatarInventoryId()) == 0) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        if (request.getItems() == null) {
            return;
        }

        for (SaveRoomItemRequest item : request.getItems()) {
            if (roomMapper.existsUserInventory(userId, item.getUserInventoryId()) == 0) {
                throw new BusinessException(ErrorCode.FORBIDDEN);
            }
        }
    }

    private void validateItemCount(MiniRoom room, SaveRoomRequest request) {
        int itemCount = request.getItems() == null ? 0 : request.getItems().size();
        int maxItemCount = room.getMaxItemCount() == null ? DEFAULT_MAX_ITEM_COUNT : room.getMaxItemCount();
        if (itemCount > maxItemCount) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
    }

    private void validateUserId(Long userId) {
        if (userId == null) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
    }

    private <T> T defaultValue(T value, T defaultValue) {
        return value == null ? defaultValue : value;
    }
}
