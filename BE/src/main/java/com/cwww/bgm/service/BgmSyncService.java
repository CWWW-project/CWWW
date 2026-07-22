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

    private static final int DEFAULT_PRICE = 300; // 도토리 가격, 실제 정책 확인 필요

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

            // NC 라이선스거나 다운로드 불가면 스킵
            if(!track.isUsable()) {

                log.info("스킵 (NC 라이선스 또는 다운로드 불가): {} - {}", track.name(), track.artist_name());
                continue;

            }

            // 등록 시도 (실패해도 나머지 트랙은 계속 진행)
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
     * Jamendo API 호출 - ccnc=false로 요청 시점에 비상업용(NC) 라이선스 트랙 제외
     * audiodownload_allowed는 응답 필드일 뿐 요청 파라미터가 아니라, 다운로드 가능 여부는
     * amendoTrack.isUsable()에서 응답을 받은 뒤 클라이언트 사이드로 한번 더 걸러냄
     */
    private List<JamendoTrack> searchJamendoTracks(int limit) {

        // 매번 다른 지점부터 가져오기 위해 offset을 무작위로 설정
        // (Jamendo API는 order=random을 지원하지 않아, offset으로 유사한 효과를 냄)
        int randomOffset = (int) (Math.random() * 500);

        // get 방식으로 웹 요청 보낼 준비
        JamendoResponse response = restClient.get() 
                // 실제 주소
                .uri(jamendoApiUrl + "?client_id={clientId}&format=json&limit={limit}&offset={offset}&ccnc=false&include=licenses+musicinfo&audioformat=mp32",
                        jamendoClientId, limit, randomOffset)// client_id + 몇 곡 가져올지
                .retrieve() // 진짜 요청 보내기
                .body(JamendoResponse.class);

        return response != null ? response.results() : List.of();

    }


    /*
     * 트랙 하나를 item + media에 등록 (URL만 참조, 파일 다운로드 없음)
     * 이미 같은 이름("제목 - 아티스트")으로 등록된 BGM이 있으면 ON CONFLICT DO NOTHING으로 조용히 스킵됨
     */
    private boolean registerTrack(JamendoTrack track) {

        // itemName에 넣을 이름 조합 (name = "제목 - 아티스트")
        String itemName = track.name() + " - " + track.artist_name();
        // 아이템 소개글 (재생시간 + 태그 조합)
        String description = buildDescription(track);

        /*
         * 1. item 테이블에 등록
         * 필요한 정보만 담아서 그릇(param) 만들기 (itemId는 아직 없음)
         */
        BgmItemMapper.BgmItemInsertParam itemParam =
                new BgmItemMapper.BgmItemInsertParam(itemName, description, DEFAULT_PRICE);

        // 2. DB에 저장 요청 (동시에 MyBatis가 자동생성된 itemId를 param 안에 몰래 채워줌)
        int inserted = bgmItemMapper.insertBgmItem(itemParam);

        // ON CONFLICT DO NOTHING에 걸리면 영향받은 row가 0건 -> 이미 등록된 곡이라는 뜻
        if (inserted == 0) {
            log.info("스킵 (이미 등록된 곡): {}", itemName);
            return false;
        }

        // DB에서 생성된 itemId가 들어있음
        Long itemId = itemParam.getItemId();

        /*
         * 3. media 테이블에 등록 (target_type='ITEM', target_id=item_id, media_url=Jamendo 스트리밍 URL 그대로)
         * 이 itemId를 media 저장에 그대로 사용
         */
        Media media = Media.builder()
                .targetType(Media.TargetType.BGM)
                .targetId(itemId)
                .mediaUrl(track.audio())
                .createdAt(LocalDateTime.now())
                .build();
        profileMediaMapper.insertMedia(media);

        log.info("BGM 등록 완료: itemId={}, name={}", itemId, itemName);

        return true;

    }


    // 재생시간 + 태그(장르/무드)를 조합해서 description 문자열 생성
    private String buildDescription(JamendoTrack track) {

        String tags = track.tagsAsString();
        String base = "재생시간 : " + track.formattedDuration();

        return tags.isEmpty() ? base : base + " · " + tags;

    }

}
