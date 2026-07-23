package com.cwww.minihompy.mapper;

import com.cwww.minihompy.domain.Media;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

// 프로필 사진 등록/갱신/삭제
@Mapper
public interface ProfileMediaMapper {

    // media 신규 등록 (BGM 카탈로그 등록 등 - target_id가 항상 새로운 경우에 사용, 매번 새 행 생성)
    int insertMedia(Media media);

    /*
     * 원자적 upsert (PROFILE/BACKGROUND singleton partial unique index 기준)
     * select-then-branch 대신 DB가 직접 처리해서 동시 업로드 race condition 방지
     */
    void upsertMedia(Media media);

    // 소프트 삭제 (target_type + target_id 기준), 대상이 없어도 에러 아님(0건 처리)
    int deleteMedia(
            @Param("targetType") Media.TargetType targetType,
            @Param("targetId") Long targetId);

}
