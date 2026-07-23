package com.cwww.room.service;

import com.cwww.room.dto.RoomResponse;
import com.cwww.room.dto.SaveRoomRequest;

public interface RoomService {

    RoomResponse getRoom(Long userId);

    RoomResponse saveRoom(Long userId, SaveRoomRequest request);
}
