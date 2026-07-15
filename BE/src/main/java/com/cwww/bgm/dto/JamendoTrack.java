package com.cwww.bgm.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/*
 * Jamendo API 트랙 검색 응답 매핑용
 * https://api.jamendo.com/v3.0/tracks/ 응답 필드 중 필요한 것만
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record JamendoTrack(

        String id,
        String name, // 곡 제목
        String artist_name, // 아티스트
        String license_ccurl, // 라이선스 URL (nc 포함되면 비상업용 -> 제외 대상)

        String audiodownload, // 실제 mp3 다운로드 URL
        boolean audiodownload_allowed

) {

    // 비상업용(Non-Commercial) 라이선스인지 판다
    public boolean isNonCommercial() {
        return license_ccurl != null && license_ccurl.contains("-nc");
    }

    // 실제로 다운로드 해서 쓸 수 있는 트랙인지 (다운로드 허용 + 비상업용 아님)
    public boolean isUsable() {
        return audiodownload_allowed && !isNonCommercial();
    }

}
