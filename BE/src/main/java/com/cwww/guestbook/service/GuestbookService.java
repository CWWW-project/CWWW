package com.cwww.guestbook.service;

import com.cwww.global.exception.BusinessException;
import com.cwww.global.exception.ErrorCode;
import com.cwww.global.notification.dto.NotificationEvent;
import com.cwww.global.notification.redis.RedisNotificationPublisher;
import com.cwww.guestbook.domain.Guestbook;
import com.cwww.guestbook.dto.request.GuestbookCreateRequest;
import com.cwww.guestbook.dto.request.GuestbookUpdateRequest;
import com.cwww.guestbook.dto.response.GuestbookFeedResponse;
import com.cwww.guestbook.dto.response.GuestbookResponse;
import com.cwww.guestbook.mapper.GuestbookMapper;
import com.cwww.user.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class GuestbookService {

    private final GuestbookMapper guestbookMapper;
    private final UserMapper userMapper;
    private final RedisNotificationPublisher notificationPublisher;

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

        publishGuestbookCreatedNotification(ownerId, guestbook);

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
                    .writerProfileImageUrl(g.getWriterProfileImageUrl())   // 추가 — 프로필 사진은 비밀글이어도 보여줌
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


    // 방명록 수정 (작성자 본인만 가능)
    @Transactional
    public void updateGuestbook(Long userId, Long guestbookId, GuestbookUpdateRequest request) {

        // 방명록 존재 확인
        Guestbook guestbook = guestbookMapper.findById(guestbookId)
                .orElseThrow(() -> new BusinessException(ErrorCode.GUESTBOOK_NOT_FOUND)); // 방명록 못 찾은 경우

        // 작성자 본인이 아닐 경우
        if(!guestbook.getWriterId().equals(userId)) {
            throw new BusinessException(ErrorCode.GUESTBOOK_FORBIDDEN);
        }

        // isSecret을 안 보냈으면(null) 기존 값 유지, 보냈으면 그 값으로 변경
        boolean secretToSave = (request.getSecret() != null) ? request.getSecret() : guestbook.isSecret();

        int updated = guestbookMapper.updateGuestbook(guestbookId, request.getContent(), secretToSave);

        // 수정 실패한 경우
        if(updated == 0) {
            throw new BusinessException(ErrorCode.GUESTBOOK_NOT_FOUND);
        }

    }


    // 방명록 소프트 삭제 (작성자 본인, 홈피 주인 가능)
    @Transactional
    public void deleteGuestbook(Long userId, Long ownerId, Long guestbookId) {

        // minihompyId 찾아오기
        Long minihompyId = guestbookMapper.selectMinihompyIdByOwnerId(ownerId);

        // 미니홈피 자체가 없는 경우 (방명록이 없는 경우와 구분하기 위해)
        if(minihompyId == null) {
            throw new BusinessException(ErrorCode.MINIHOMPY_NOT_FOUND);
        }

        /*
         * guestbookId가 실제로 이 미니홈피(minihompyId) 소속인지까지 검증
         * (그냥 findById만 쓰면, 본인 홈피의 ownerId로 요청하면서 다른 홈피의 guestbookId를 넣어
         * 삭제해버리는 취약점이 생김 - 반드시 minihompyId까지 같이 확인해야 함)
         */
        Guestbook guestbook = guestbookMapper.findByIdAndMinihompyId(guestbookId, minihompyId)
                .orElseThrow(() -> new BusinessException(ErrorCode.GUESTBOOK_NOT_FOUND));


        // 작성자 본인인 경우
        boolean isWriter = guestbook.getWriterId().equals(userId);
        // 홈피 주인인 경우
        boolean isHompiOwner = ownerId.equals(userId);

        // 작성자 본인도 아니고 홈피 주인도 아닌 경우
        if(!isWriter && !isHompiOwner) {
            throw new BusinessException(ErrorCode.GUESTBOOK_FORBIDDEN);
        }

        int deleted = guestbookMapper.deleteGuestbook(guestbookId);

        // 삭제 실패한 경우
        if(deleted == 0) {
            throw new BusinessException(ErrorCode.GUESTBOOK_NOT_FOUND);
        }

    }

    private void publishGuestbookCreatedNotification(Long ownerId, Guestbook guestbook) {
        if(ownerId.equals(guestbook.getWriterId())) {
            return;
        }

        String actorName = userMapper.findNicknameById(guestbook.getWriterId());
        NotificationEvent event = NotificationEvent.builder()
                .eventType("GUESTBOOK_CREATED")
                .targetUserId(ownerId)
                .actorId(guestbook.getWriterId())
                .actorName(actorName)
                .targetId(guestbook.getGuestbookId())
                .targetType("GUESTBOOK")
                .preview(actorName + "님이 방명록을 남겼습니다.")
                .createdAt(LocalDateTime.now())
                .build();

        Runnable publish = () -> {
            try {
                notificationPublisher.publish(event);
            } catch (Exception e) {
                log.warn("방명록 알림 발행 실패: guestbookId={}, ownerId={}, writerId={}",
                        guestbook.getGuestbookId(), ownerId, guestbook.getWriterId(), e);
            }
        };

        if(TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    publish.run();
                }
            });
            return;
        }

        publish.run();
    }

}
