package com.cwww.user.controller;

import com.cwww.global.response.ApiResponse;
import com.cwww.user.dto.UserSearchResponse;
import com.cwww.user.mapper.UserMapper;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserMapper userMapper;

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<UserSearchResponse>>> search(
            @RequestParam @NotBlank String nickname) {
        List<UserSearchResponse> result = userMapper.searchByNickname(nickname, 10).stream()
                .map(UserSearchResponse::from)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
