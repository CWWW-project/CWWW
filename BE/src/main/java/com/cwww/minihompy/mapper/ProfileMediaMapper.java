package com.cwww.minihompy.mapper;

import com.cwww.minihompy.domain.Media;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

// 프로필 사진 등록/갱신/삭제
@Mapper
public interface ProfileMediaMapper {

    // target_type + target_id 기준 media 조회
    Media selectMedia(@Param("targetType") Media.TargetType targetType, @Param("targetId") Long targetId);

    // media 등록
    int insertMedia(Media media);

    // 기존 media 갱신
    int updateMedia(Media media);

    // media 삭제
    void deleteMedia(
            @Param("targetType") Media.TargetType targetType,
            @Param("targetId") Long targetId);

}
