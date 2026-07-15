package com.cwww.guestbook.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

// 방명록 목록 조회 응답 (커서 기반 페이징)
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GuestbookFeedResponse {

    private List<GuestbookResponse> guestbooks;
    private Long nextCursor;
    private boolean hasNext;

}
