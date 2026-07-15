package com.cwww.bgm.service;

import com.cwww.bgm.dto.JamendoResponse;
import com.cwww.bgm.dto.JamendoTrack;
import com.cwww.bgm.mapper.BgmItemMapper;
import com.cwww.minihompy.domain.Media;
import com.cwww.minihompy.mapper.ProfileMediaMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.time.LocalDateTime;
import java.util.List;

/*
 * Jamendo API에서 BGM 트랙을 검색해서, 그 스트리밍 URL을 그대로 참조하는
 * 방식으로 item(BGM 상품) + media(오디오 URL) 테이블에 등록하는 초기 카탈로그 구축용 서비스.
 *
 * 파일을 직접 다운로드/저장하지 않고, Jamendo가 제공하는 URL을 media_url에 그대로 저장.
 * item 테이블은 정용혁님 도메인 소유라, 이 서비스가 직접 쓰기 작업을 한다는 걸 공유해두어야 함.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BgmSyncService {

    private final BgmItemMapper bgmItemMapper;
    private final ProfileMediaMapper profileMediaMapper; // insertMedia 재사용 (target_type만 ITEM으로)

    @Value("${jamendo.client-id}")
    private String jamendoClientId;

    @Value("${jamendo.api-url}")
    private String jamendoApiUrl;

    private static final int DEFAULT_PRICE = 100; // 도토리 가격, 실제 정책 확인 필요

    private final RestClient restClient = RestClient.create();


    /*
     * Jamendo에서 트랙을 검색해서 최대 limit개를 우리 카탈로그(item+media)에 등록
     * 비상업용(NC) 라이선스, 다운로드 비허용 트랙은 자동 제외
     */
    @Transactional
    public int syncFromJamendo(int limit) {

        List<JamendoTrack> tracks = searchJamendoTracks(limit);

        int registered = 0;

        for(JamendoTrack track : tracks) {

            if(!track.isUsable()) {

                log.info("스킵 (NC 라이선스 또는 다운로드 불가): {} - {}", track.name(), track.artist_name());
                continue;

            }

            try {

                if(registerTrack(track)) {
                    registered++;
                }

            } catch (Exception e) {
                log.warn("BGM 등록 실패: trackId={}, name={}", track.id(), track.name(), e);
            }

        }

        log.info("Jamendo BGM 동기화 완료: 요청 {}건 중 {}건 등록", tracks.size(), registered);

        return registered;

    }


    /*
     * Jamendo API 호출
     * audiodownload_allowed는 응답 필드일 뿐 요청 파라미터가 아니라, 다운로드 가능 여부는
     * amendoTrack.isUsable()에서 응답을 받은 뒤 클라이언트 사이드로 한번 더 걸러냄
     */
    private List<JamendoTrack> searchJamendoTracks(int limit) {

        JamendoResponse response = restClient.get()
                .uri(jamendoApiUrl + "?client_id={clientId}&format=json&limit={limit}&ccnc=false&include=licenses&audioformat=mp32",
                        jamendoClientId, limit)
                .retrieve()
                .body(JamendoResponse.class);

        return response != null ? response.results() : List.of();

    }


    /*
     * 트랙 하나를 item + media에 등록 (URL만 참조, 파일 다운로드 없음)
     * 이미 같은 이름("제목 - 아티스트")으로 등록된 BGM이 있으면 스킵하고 false 반환
     */
    private boolean registerTrack(JamendoTrack track) {

        // itemName에 넣을 이름 조합 (name = "제목 - 아티스트")
        String itemName = track.name() + " - " + track.artist_name();

        // 이미 등록된(중복된) 곡인지 확인
        if (bgmItemMapper.countBgmItemByName(itemName) > 0) {

            log.info("스킵 (이미 등록된 곡): {}", itemName);
            return false;

        }

        // 1. item 테이블에 등록
        BgmItemMapper.BgmItemInsertParam itemParam =
                new BgmItemMapper.BgmItemInsertParam(itemName, "Jamendo 무료 BGM", DEFAULT_PRICE);

        bgmItemMapper.insertBgmItem(itemParam);
        Long itemId = itemParam.getItemId();

        // 2. media 테이블에 등록 (target_type='ITEM', target_id=item_id, media_url=Jamendo 스트리밍 URL 그대로)
        Media media = Media.builder()
                .targetType(Media.TargetType.BGM)
                .targetId(itemId)
                .mediaUrl(track.audiodownload())
                .createdAt(LocalDateTime.now())
                .build();
        profileMediaMapper.insertMedia(media);

        log.info("BGM 등록 완료: itemId={}, name={}", itemId, itemName);

        return true;

    }

}
