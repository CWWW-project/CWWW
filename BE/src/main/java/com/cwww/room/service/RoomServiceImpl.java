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

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RoomServiceImpl implements RoomService {

    private static final int DEFAULT_MAX_ITEM_COUNT = 50;
    private static final String DEFAULT_BACKGROUND_ASSET_KEY = "classic";
    private static final String DEFAULT_BACKGROUND_ASSET_URL = "/miniroom-assets/backgrounds/bg_room.png";
    private static final String DEFAULT_AVATAR_ASSET_KEY = "avatar-rose";
    private static final String DEFAULT_AVATAR_ASSET_URL = "/miniroom-assets/avatars/avatar_01_rose.png";

    private final RoomMapper roomMapper;

    @Override
    @Transactional
    public RoomResponse getRoom(Long userId) {
        validateUserId(userId);
        MiniRoom room = getOrCreateRoom(userId, DEFAULT_BACKGROUND_ASSET_KEY, DEFAULT_BACKGROUND_ASSET_URL);
        return buildRoomResponse(room);
    }

    @Override
    @Transactional
    public RoomResponse saveRoom(Long userId, SaveRoomRequest request) {
        validateUserId(userId);
        if (request == null) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }

        MiniRoom room = getOrCreateRoom(
                userId,
                defaultValue(request.getBackgroundAssetKey(), DEFAULT_BACKGROUND_ASSET_KEY),
                defaultValue(request.getBackgroundAssetUrl(), DEFAULT_BACKGROUND_ASSET_URL)
        );

        validateItemCount(room, request);
        validateInventoryOwnership(userId, request);
        updateRoom(room, request);
        saveRoomItems(room.getId(), request.getItems());
        saveAvatar(userId, request.getAvatar());

        MiniRoom savedRoom = roomMapper.selectRoomByUserId(userId);
        return buildRoomResponse(savedRoom);
    }

    private MiniRoom getOrCreateRoom(Long userId, String backgroundAssetKey, String backgroundAssetUrl) {
        MiniRoom room = roomMapper.selectRoomByUserId(userId);
        if (room != null) {
            return room;
        }

        // 첫 조회에서도 빈 화면 대신 기본 미니룸을 돌려주기 위해 방을 바로 생성한다.
        MiniRoom newRoom = new MiniRoom();
        newRoom.setUserId(userId);
        newRoom.setBackgroundAssetKey(backgroundAssetKey);
        newRoom.setBackgroundAssetUrl(backgroundAssetUrl);
        roomMapper.insertRoom(newRoom);
        return roomMapper.selectRoomByUserId(userId);
    }

    private RoomResponse buildRoomResponse(MiniRoom room) {
        List<RoomItemResponse> items = roomMapper.selectRoomItems(room.getId());
        AvatarResponse avatar = roomMapper.selectAvatarResponseByUserId(room.getUserId());
        if (avatar == null) {
            avatar = defaultAvatar();
        } else if (avatar.getAssetUrl() == null) {
            // 이전 데이터에 에셋 정보가 없더라도 기본 아바타는 항상 보이도록 보정한다.
            avatar.setAssetKey(DEFAULT_AVATAR_ASSET_KEY);
            avatar.setAssetUrl(DEFAULT_AVATAR_ASSET_URL);
            avatar.setAssetWidth(48);
            avatar.setAssetHeight(72);
        }
        return RoomResponse.of(room, avatar, items);
    }

    private AvatarResponse defaultAvatar() {
        return AvatarResponse.builder()
                .assetKey(DEFAULT_AVATAR_ASSET_KEY)
                .assetUrl(DEFAULT_AVATAR_ASSET_URL)
                .assetWidth(48)
                .assetHeight(72)
                .posX(318)
                .posY(438)
                .scale(BigDecimal.ONE)
                .flipped(false)
                .build();
    }

    private void updateRoom(MiniRoom room, SaveRoomRequest request) {
        room.setBackgroundInventoryId(request.getBackgroundInventoryId());
        room.setBackgroundAssetKey(defaultValue(request.getBackgroundAssetKey(), room.getBackgroundAssetKey()));
        room.setBackgroundAssetUrl(defaultValue(request.getBackgroundAssetUrl(), room.getBackgroundAssetUrl()));
        roomMapper.updateRoom(room);
    }

    private void saveRoomItems(Long roomId, List<SaveRoomItemRequest> items) {
        // 미니룸 저장은 현재 화면 구성을 기준으로 전체 교체한다.
        // 삭제된 장식까지 별도로 비교하지 않아도 최종 배치와 DB 상태가 정확히 맞는다.
        roomMapper.deleteRoomItems(roomId);
        if (items == null || items.isEmpty()) {
            return;
        }

        for (SaveRoomItemRequest itemRequest : items) {
            MiniRoomItem item = new MiniRoomItem();
            item.setMiniRoomId(roomId);
            item.setUserInventoryId(itemRequest.getUserInventoryId());
            item.setSnapshotCategory(itemRequest.getCategory());
            item.setSnapshotName(itemRequest.getName());
            item.setSnapshotAssetKey(itemRequest.getAssetKey());
            item.setSnapshotAssetUrl(itemRequest.getAssetUrl());
            item.setSnapshotAssetWidth(itemRequest.getAssetWidth());
            item.setSnapshotAssetHeight(itemRequest.getAssetHeight());
            item.setSnapshotPlacementType(itemRequest.getPlacementType());
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
            avatar.setSnapshotAssetKey(request.getAssetKey());
            avatar.setSnapshotAssetUrl(request.getAssetUrl());
            avatar.setSnapshotAssetWidth(request.getAssetWidth());
            avatar.setSnapshotAssetHeight(request.getAssetHeight());
            avatar.setPosX(request.getPosX());
            avatar.setPosY(request.getPosY());
            avatar.setScale(request.getScale());
            avatar.setFlipped(defaultValue(request.getFlipped(), false));
            roomMapper.insertAvatar(avatar);
            return;
        }

        avatar.setAvatarInventoryId(request.getAvatarInventoryId());
        avatar.setSnapshotAssetKey(request.getAssetKey());
        avatar.setSnapshotAssetUrl(request.getAssetUrl());
        avatar.setSnapshotAssetWidth(request.getAssetWidth());
        avatar.setSnapshotAssetHeight(request.getAssetHeight());
        avatar.setPosX(request.getPosX());
        avatar.setPosY(request.getPosY());
        avatar.setScale(request.getScale());
        avatar.setFlipped(defaultValue(request.getFlipped(), false));
        roomMapper.updateAvatar(avatar);
    }

    private void validateInventoryOwnership(Long userId, SaveRoomRequest request) {
        // 구매 아이템은 요청한 사용자의 보유함에 있는 경우에만 배치할 수 있다.
        // 보유함 ID가 없는 기본 에셋은 복원 가능한 assetUrl을 반드시 받아야 한다.
        if (request.getBackgroundInventoryId() != null
                && roomMapper.existsUserInventory(userId, request.getBackgroundInventoryId()) == 0) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        if (request.getAvatar() != null
                && request.getAvatar().getAvatarInventoryId() != null
                && roomMapper.existsUserInventory(userId, request.getAvatar().getAvatarInventoryId()) == 0) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        if (request.getAvatar() != null
                && request.getAvatar().getAvatarInventoryId() == null
                && isBlank(request.getAvatar().getAssetUrl())) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }

        if (request.getItems() == null) {
            return;
        }

        for (SaveRoomItemRequest item : request.getItems()) {
            if (item.getUserInventoryId() != null && roomMapper.existsUserInventory(userId, item.getUserInventoryId()) == 0) {
                throw new BusinessException(ErrorCode.FORBIDDEN);
            }
            if (item.getUserInventoryId() == null && isBlank(item.getAssetUrl())) {
                throw new BusinessException(ErrorCode.INVALID_INPUT);
            }
            if (item.getPosX() == null || item.getPosY() == null) {
                throw new BusinessException(ErrorCode.INVALID_INPUT);
            }
        }
    }

    private void validateItemCount(MiniRoom room, SaveRoomRequest request) {
        int itemCount = request.getItems() == null ? 0 : request.getItems().size();
        int maxItemCount = room.getMaxItemCount() == null ? DEFAULT_MAX_ITEM_COUNT : room.getMaxItemCount();
        // 한 화면에 과도한 장식이 저장되는 것을 막아 조회와 렌더링 부담을 제한한다.
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

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
