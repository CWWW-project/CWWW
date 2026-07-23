package com.cwww.room.controller;

import com.cwww.global.response.ApiResponse;
import com.cwww.room.dto.RoomResponse;
import com.cwww.room.dto.SaveRoomRequest;
import com.cwww.room.service.RoomService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;

    @GetMapping("/{userId}")
    public ApiResponse<RoomResponse> getRoom(@PathVariable Long userId) {
        return ApiResponse.success(roomService.getRoom(userId));
    }

    @GetMapping("/me")
    public ApiResponse<RoomResponse> getMyRoom(
            @AuthenticationPrincipal Long userId
    ) {
        return ApiResponse.success(roomService.getRoom(userId));
    }

    @PutMapping("/me")
    public ApiResponse<RoomResponse> saveMyRoom(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody SaveRoomRequest request
    ) {
        return ApiResponse.success(roomService.saveRoom(userId, request));
    }
}
