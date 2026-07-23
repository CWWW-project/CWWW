package com.cwww.minihompy.service;

import com.cwww.minihompy.domain.VisitLog;
import com.cwww.minihompy.dto.response.VisitorLogResponse;
import com.cwww.minihompy.mapper.VisitLogMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/*
 * 방문자 기록 조회 및 기록 전담 Service
 * getRecentVisitors: "방문자 목록 페이지" 조회 담당
 * recordVisit: 별도 트랜잭션(REQUIRES_NEW)에서 방문 기록 INSERT - MinihompyService의 메인 조회 트랜잭션과 격리하기 위함
 */
@Service
@RequiredArgsConstructor
public class VisitLogService {

    private final VisitLogMapper visitLogMapper;

    private static final int RECENT_VISITOR_LIMIT = 20;


    // 방문자 기록 조회 (홈피 주인 본인만) - 최근 20명
    public List<VisitorLogResponse> getRecentVisitors(Long userId) {

        List<VisitorLogResponse> visitors = visitLogMapper.selectRecentVisitors(userId, RECENT_VISITOR_LIMIT);

        return visitors;

    }


    // 방문 기록 INSERT (별도 트랜잭션 - 실패해도 호출한 쪽 트랜잭션에 영향 없음)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordVisit(Long ownerId, Long viewerId) {
        Long minihompyId = visitLogMapper.selectMinihompyIdByOwnerId(ownerId);

        VisitLog visitLog = VisitLog.builder()
                .minihompyId(minihompyId)
                .visitorId(viewerId)
                .visitedAt(LocalDateTime.now())
                .build();

        visitLogMapper.insertVisit(visitLog);
    }

}
