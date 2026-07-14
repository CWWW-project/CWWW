package com.cwww.minihompy.service;

import com.cwww.minihompy.dto.response.VisitorLogResponse;
import com.cwww.minihompy.mapper.VisitLogMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

/*
 * 방문자 기록 조회 전담 Service
 * 방문 기록/카운트 로직 자체는 MinihompyService.getMinihompyMain()에서 처리하고,
 * 여기서는 "방문자 목록 페이지" 전용 조회만 담당 (화면이 분리되어 있어 Controller/Service도 분리)
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

}
