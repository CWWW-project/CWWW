package com.cwww.bgm.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

/*
 * Jamendo API 트랙 검색 응답 매핑용
 * https://api.jamendo.com/v3.0/tracks/ 응답 필드 중 필요한 것만
 * include=musicinfo 파라미터로 tags(장르/무드) 정보도 같이 받아옴
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record JamendoTrack(

        String id,
        String name, // 곡 제목
        String artist_name, // 아티스트
        String license_ccurl, // 라이선스 URL (nc 포함되면 비상업용 -> 제외 대상)
        String audio, // 스트리밍(재생)용 URL - 실제 media_url에 저장할 값
        String audiodownload, // 다운로드용 URL (재생용 아님, 여기선 안 씀)
        boolean audiodownload_allowed,
        int duration, // 재생시간 (초 단위)
        MusicInfo musicinfo // 장르/무드 태그 (include=musicinfo 필요)

) {

    // 비상업용(Non-Commercial) 라이선스인지 판다
    public boolean isNonCommercial() {

        return license_ccurl != null && license_ccurl.contains("-nc");

    }

    // 실제로 다운로드 해서 쓸 수 있는 트랙인지 (다운로드 허용 + 비상업용 아님)
    public boolean isUsable() {

        return audiodownload_allowed && !isNonCommercial();

    }

    // 재생시간을 "3:32" 같은 형태로 변환 (item.description에 넣을 용도)
    public String formattedDuration() {

        int minutes = duration / 60;
        int seconds = duration % 60;

        return String.format("%d:%02d", minutes, seconds);

    }

    // 태그(장르+악기+기타)를 하나로 합쳐서 "energetic, rock, guitar" 형태 문자열로 변환 (없으면 빈 문자열)
    public String tagsAsString() {

        if(musicinfo == null || musicinfo.tags() == null) {
            return "";
        }

        List<String> all = new java.util.ArrayList<>();
        Tags tags = musicinfo.tags();

        if (tags.genres() != null) all.addAll(tags.genres());
        if (tags.instruments() != null) all.addAll(tags.instruments());
        if (tags.vartags() != null) all.addAll(tags.vartags());

        return String.join(", ", all);

    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record MusicInfo(Tags tags) {}

    // Jamendo tracks API의 실제 tags 구조 - 단순 배열이 아니라 genres/instruments/vartags로 분류된 객체
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Tags(List<String> genres, List<String> instruments, List<String> vartags) {}

}
