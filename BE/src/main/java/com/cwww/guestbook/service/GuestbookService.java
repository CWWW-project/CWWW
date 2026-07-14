package com.cwww.guestbook.service;

import com.cwww.global.exception.BusinessException;
import com.cwww.global.exception.ErrorCode;
import com.cwww.guestbook.domain.Guestbook;
import com.cwww.guestbook.dto.request.GuestbookCreateRequest;
import com.cwww.guestbook.dto.response.GuestbookFeedResponse;
import com.cwww.guestbook.dto.response.GuestbookResponse;
import com.cwww.guestbook.mapper.GuestbookMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GuestbookService {

    private final GuestbookMapper guestbookMapper;

    // 방명록 작성
    @Transactional
    public void createGuestbook(Long ownerId, Long writerId, GuestbookCreateRequest request) {

        // minihompyId 조회
        Long minihompyId = guestbookMapper.selectMinihompyIdByOwnerId(ownerId);

        // minihompy가 없거나 작성 중 삭제된 경우
        if(minihompyId == null) {
            throw new BusinessException(ErrorCode.MINIHOMPY_NOT_FOUND);
        }

        Guestbook guestbook = Guestbook.builder()
                .minihompyId(minihompyId)
                .writerId(writerId)
                .content(request.getContent())
                .secret(request.isSecret())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        int inserted = guestbookMapper.insertGuestbook(guestbook);

        // insert 실패했을 경우
        if(inserted != 1) {
            throw new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR);
        }

    }


    // 방명록 목록 조회 (커서 기반 페이징, 비밀글 마스킹 처리)
    public GuestbookFeedResponse getGuestbooks(Long ownerId, Long viewerId, Long cursor, int size) {

        Long minihompyId = guestbookMapper.selectMinihompyIdByOwnerId(ownerId);

        // 존재하지 않는 미니홈피면 "방명록 없음"이 아니라 404로 명확히 구분
        if(minihompyId == null) {
            throw new BusinessException(ErrorCode.MINIHOMPY_NOT_FOUND);
        }

        List<GuestbookResponse> raw = guestbookMapper.selectFeed(ownerId, cursor, size + 1);

        // raw.size()가 더 크면 요청한 size 수 보다 더 있다는 뜻
        boolean hasNext = raw.size() > size;

        if(hasNext) {
            // 요청 size 수 보다 클 경우 마지막 한 개 버리기 (위에서 1개 플러스 해서 가져왔으니)
            raw = raw.subList(0, size);
        }

        // 더 있을 경우 다음 페이지 요청할 때 쓸 기준점으로 저장, 더 없으면 null
        Long nextCursor = hasNext ? raw.get(raw.size() - 1).getGuestbookId() : null;

        // 홈피 주인인지 판단(비밀글 볼 수 있는지 판단용)
        boolean isOwner = viewerId != null && viewerId.equals(ownerId);

        // 방명록 가공 - DB에서 가져온 방명록 하나하나를 가공된 버전으로 바꾸기
        List<GuestbookResponse> enriched = raw.stream()
                .map(g -> enrichResponse(g, isOwner, viewerId))
                .toList();

        return GuestbookFeedResponse.builder()
                .guestbooks(enriched)
                .nextCursor(nextCursor)
                .hasNext(hasNext)
                .build();

    }


    // 비밀글 마스킹 + canEdit/canDelete(수정/삭제 버튼 노출 여부) 계산
    private GuestbookResponse enrichResponse(GuestbookResponse g, boolean isOwner, Long viewerId) {

        // 글 쓴 사람이 본인인지 확인
        boolean isWriter = viewerId != null && viewerId.equals(g.getWriterId());
        // 수정 가능한지 (작성자 본인일 경우만)
        boolean canEdit = isWriter;
        // 삭제 가능한지 (작성자거나 홈피 주인인 경우)
        boolean canDelete = isWriter || isOwner;

        // 비밀글일 경우
        if(g.isSecret() && !isOwner && !isWriter) {

            // 보는 사람이 홈피 주인도 아니고 작성자 본인도 아니면 content를 null로 지우기
            return GuestbookResponse.builder()
                    .guestbookId(g.getGuestbookId())
                    .writerId(g.getWriterId())
                    .writerNickname(g.getWriterNickname())
                    .content(null) // 내용 숨김
                    .secret(true)
                    .visible(false) // 못 본다는 표시
                    .canEdit(canEdit)
                    .canDelete(canDelete)
                    .createdAt(g.getCreatedAt())
                    .updatedAt(g.getUpdatedAt())
                    .build();

        }

        return g.toBuilder()
                .visible(true)
                .canEdit(canEdit)
                .canDelete(canDelete)
                .build();

    }

}
