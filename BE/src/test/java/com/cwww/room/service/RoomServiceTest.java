package com.cwww.room.service;

import com.cwww.global.exception.BusinessException;
import com.cwww.global.exception.ErrorCode;
import com.cwww.room.domain.MiniRoom;
import com.cwww.room.domain.MiniRoomItem;
import com.cwww.room.dto.RoomItemResponse;
import com.cwww.room.dto.SaveRoomItemRequest;
import com.cwww.room.dto.SaveRoomRequest;
import com.cwww.room.mapper.RoomMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class RoomServiceTest {

    @Mock private RoomMapper roomMapper;

    @InjectMocks
    private RoomServiceImpl roomService;

    @Test
    @DisplayName("미니룸 조회 성공")
    void getRoom_success() {
        // Arrange
        MiniRoom room = room(1L, 1L, 50);
        given(roomMapper.selectRoomByUserId(1L)).willReturn(room);
        given(roomMapper.selectRoomItems(1L)).willReturn(List.of(new RoomItemResponse()));

        // Act
        var response = roomService.getRoom(1L);

        // Assert
        assertThat(response.getRoomId()).isEqualTo(1L);
        assertThat(response.getItems()).hasSize(1);
    }

    @Test
    @DisplayName("미니룸 조회 실패 - 미니룸 없음")
    void getRoom_notFound() {
        // Arrange
        given(roomMapper.selectRoomByUserId(1L)).willReturn(null);

        // Act & Assert
        assertThatThrownBy(() -> roomService.getRoom(1L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.NOT_FOUND);
    }

    @Test
    @DisplayName("미니룸 저장 성공")
    void saveRoom_success() {
        // Arrange
        MiniRoom room = room(1L, 1L, 50);
        SaveRoomRequest request = saveRoomRequest(10L, List.of(saveRoomItem(20L)));
        given(roomMapper.selectRoomByUserId(1L)).willReturn(room, room);
        given(roomMapper.existsUserInventory(1L, 10L)).willReturn(1);
        given(roomMapper.existsUserInventory(1L, 20L)).willReturn(1);
        given(roomMapper.selectRoomItems(1L)).willReturn(List.of(new RoomItemResponse()));

        // Act
        var response = roomService.saveRoom(1L, request);

        // Assert
        verify(roomMapper).updateRoom(room);
        verify(roomMapper).deleteRoomItems(1L);
        verify(roomMapper).insertRoomItem(any(MiniRoomItem.class));
        assertThat(response.getRoomId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("미니룸 저장 성공 - 미니룸이 없으면 생성")
    void saveRoom_createRoomWhenMissing() {
        // Arrange
        MiniRoom createdRoom = room(1L, 1L, 50);
        SaveRoomRequest request = saveRoomRequest(null, List.of());
        given(roomMapper.selectRoomByUserId(1L)).willReturn(null, createdRoom);

        // Act
        var response = roomService.saveRoom(1L, request);

        // Assert
        verify(roomMapper).insertRoom(any(MiniRoom.class));
        assertThat(response.getRoomId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("미니룸 저장 실패 - 다른 유저 인벤토리")
    void saveRoom_inventoryForbidden() {
        // Arrange
        MiniRoom room = room(1L, 1L, 50);
        SaveRoomRequest request = saveRoomRequest(10L, List.of());
        given(roomMapper.selectRoomByUserId(1L)).willReturn(room);
        given(roomMapper.existsUserInventory(1L, 10L)).willReturn(0);

        // Act & Assert
        assertThatThrownBy(() -> roomService.saveRoom(1L, request))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.FORBIDDEN);
    }

    @Test
    @DisplayName("미니룸 저장 실패 - 최대 아이템 수 초과")
    void saveRoom_itemLimitExceeded() {
        // Arrange
        MiniRoom room = room(1L, 1L, 1);
        SaveRoomRequest request = saveRoomRequest(null, List.of(saveRoomItem(20L), saveRoomItem(21L)));
        given(roomMapper.selectRoomByUserId(1L)).willReturn(room);

        // Act & Assert
        assertThatThrownBy(() -> roomService.saveRoom(1L, request))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.INVALID_INPUT);
    }

    private MiniRoom room(Long roomId, Long userId, Integer maxItemCount) {
        MiniRoom room = new MiniRoom();
        room.setId(roomId);
        room.setUserId(userId);
        room.setMaxItemCount(maxItemCount);
        room.setLayoutVersion(1);
        return room;
    }

    private SaveRoomRequest saveRoomRequest(Long backgroundInventoryId, List<SaveRoomItemRequest> items) {
        SaveRoomRequest request = new SaveRoomRequest();
        request.setBackgroundInventoryId(backgroundInventoryId);
        request.setItems(items);
        return request;
    }

    private SaveRoomItemRequest saveRoomItem(Long userInventoryId) {
        SaveRoomItemRequest item = new SaveRoomItemRequest();
        item.setUserInventoryId(userInventoryId);
        item.setPosX(10);
        item.setPosY(20);
        return item;
    }
}
