package com.cwww.guestbook.controller;

import com.cwww.global.response.ApiResponse;
import com.cwww.guestbook.dto.request.GuestbookCreateRequest;
import com.cwww.guestbook.dto.response.GuestbookFeedResponse;
import com.cwww.guestbook.service.GuestbookService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@Validated
@RestController
@RequestMapping("/api/guestbooks")
@RequiredArgsConstructor
public class GuestbookController {

    private final GuestbookService guestbookService;

    // 방명록 작성
    @PostMapping("/{ownerId}")
    public ApiResponse<Void> createGuestbook(
            @PathVariable Long ownerId,
            @AuthenticationPrincipal Long writerId,
            @Valid @RequestBody GuestbookCreateRequest request
    ) {

        guestbookService.createGuestbook(ownerId, writerId, request);
        return ApiResponse.success(null);

    }

    // 방명록 목록 조회 (커서 기반 페이징)
    @GetMapping("/{ownerId}")
    public ApiResponse<GuestbookFeedResponse> getGuestbooks(
            @PathVariable Long ownerId,
            @AuthenticationPrincipal Long viewerId,
            @RequestParam(required = false) Long cursor,
            @RequestParam(defaultValue = "10") @Min(1) @Max(50) int size
    ) {

        GuestbookFeedResponse response = guestbookService.getGuestbooks(ownerId, viewerId, cursor, size);
        return ApiResponse.success(response);

    }

}
