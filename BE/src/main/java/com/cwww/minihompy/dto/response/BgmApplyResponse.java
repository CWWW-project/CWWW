package com.cwww.minihompy.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/*
 * BGM 적용 결과 응답
 * itemId가 null(BGM 끄기)이면 mediaUrl도 null로 내려감
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BgmApplyResponse {

    private Long itemId; // 적용된 아이템 id (끈 경우 null)
    private String mediaUrl; // 바로 재생할 수 있는 URL (끈 경우 null)

}
