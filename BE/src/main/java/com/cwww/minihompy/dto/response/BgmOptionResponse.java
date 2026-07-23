package com.cwww.minihompy.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 내가 보유한(구매한) BGM 목록 응답
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BgmOptionResponse {

    private Long itemId;
    private String name; // "제목 - 아티스트"
    private String mediaUrl; // 재생 URL
    private boolean applied; // 지금 내 미니홈피에 적용된 BGM인지

}
