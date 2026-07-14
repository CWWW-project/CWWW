package com.cwww.friend.controller;

import com.cwww.friend.dto.request.FriendRequest;
import com.cwww.friend.dto.response.FriendResponse;
import com.cwww.friend.service.FriendService;
import com.cwww.global.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/friends")
@RequiredArgsConstructor
public class FriendController {

    private final FriendService friendService;

    @PostMapping
    public ResponseEntity<ApiResponse<Void>> sendRequest(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody FriendRequest request) {
        friendService.sendRequest(userId, request.getReceiverId());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(null));
    }

    @PatchMapping("/{friendId}/accept")
    public ResponseEntity<ApiResponse<Void>> acceptRequest(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long friendId) {
        friendService.acceptRequest(userId, friendId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PatchMapping("/{friendId}/reject")
    public ResponseEntity<ApiResponse<Void>> rejectRequest(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long friendId) {
        friendService.rejectRequest(userId, friendId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<FriendResponse>>> getFriends(
            @RequestHeader("X-User-Id") Long userId) {
        List<FriendResponse> response = friendService.getFriends(userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/{friendId}")
    public ResponseEntity<ApiResponse<Void>> terminate(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long friendId) {
        friendService.terminate(userId, friendId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
