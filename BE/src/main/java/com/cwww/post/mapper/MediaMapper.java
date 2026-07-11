package com.cwww.post.mapper;

import com.cwww.post.domain.Media;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface MediaMapper {

    void insert(Media media);

    List<String> findUrlsByTarget(@Param("targetType") String targetType, @Param("targetId") Long targetId);

    List<Media> findAllByTargets(@Param("targetType") String targetType, @Param("targetIds") List<Long> targetIds);
}
