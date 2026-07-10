package com.cwww.friend.controller;

import com.cwww.friend.service.FriendService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/friends")
@RequiredArgsConstructor
public class FriendController {

    private final FriendService friendService;

    // TODO: POST-010 일촌 신청/수락
    // TODO: POST-011 일촌 목록/끊기
}
