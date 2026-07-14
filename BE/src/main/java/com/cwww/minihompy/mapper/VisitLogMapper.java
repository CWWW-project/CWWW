package com.cwww.minihompy.mapper;

import com.cwww.minihompy.domain.VisitLog;
import com.cwww.minihompy.dto.response.VisitorLogResponse;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface VisitLogMapper {

   // ownerId(=user_id) 기준으로 minihompyId를 조회 (VisitLog 도메인 조립에 필요)
   Long selectMinihompyIdByOwnerId(@Param("ownerId") Long ownerId);

   // 방문 기록 INSERT
   void insertVisit(VisitLog visitLog);

   // 오늘 방문자 수 (PostgreSQL 기준 ::date 캐스팅)
   long countToday(@Param("ownerId") Long ownerId);

   // 전체 방문자 수
   long countTotal(@Param("ownerId") Long ownerId);

   // 최근 방문자 목록 (닉네임, 방문시각) - 최신순
   List<VisitorLogResponse> selectRecentVisitors(
           @Param("ownerId") Long ownerId,
           @Param("limit") int limit);

}