package com.cwww.friend.service;

import com.cwww.friend.mapper.FriendMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class FriendServiceImpl implements FriendService {

    private final FriendMapper friendMapper;

    // TODO: POST-010 일촌 신청/수락
    // TODO: POST-011 일촌 목록/끊기
}
