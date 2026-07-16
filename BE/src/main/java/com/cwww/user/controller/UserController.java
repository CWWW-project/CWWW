package com.cwww.user.controller;

import com.cwww.global.exception.BusinessException;
import com.cwww.global.exception.ErrorCode;
import com.cwww.global.response.ApiResponse;
import com.cwww.user.domain.User;
import com.cwww.user.dto.UserMeResponse;
import com.cwww.user.dto.UserSearchResponse;
import com.cwww.user.dto.UserUpdateRequest;
import com.cwww.user.mapper.UserMapper;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private static final int USER_SEARCH_LIMIT = 10;

    private final UserMapper userMapper;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserMeResponse>> getMe(
            @AuthenticationPrincipal Long userId) {
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        User user = userMapper.findById(userId);
        if (user == null) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND);
        }
        return ResponseEntity.ok(ApiResponse.success(UserMeResponse.from(user)));
    }

    @PatchMapping("/me")
    public ResponseEntity<ApiResponse<UserMeResponse>> updateMe(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody UserUpdateRequest request) {
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        if (userMapper.findByNickname(request.nickname()) != null) {
            throw new BusinessException(ErrorCode.DUPLICATE_NICKNAME);
        }
        userMapper.updateNickname(userId, request.nickname());
        User user = userMapper.findById(userId);
        return ResponseEntity.ok(ApiResponse.success(UserMeResponse.from(user)));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<UserSearchResponse>>> search(
            @AuthenticationPrincipal Long userId,
            @RequestParam @NotBlank String nickname) {
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        List<UserSearchResponse> result = userMapper.searchByNickname(nickname, USER_SEARCH_LIMIT).stream()
                .map(UserSearchResponse::from)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
