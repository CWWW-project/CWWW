package com.cwww.post.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface PostLikeMapper {

    boolean exists(@Param("postId") Long postId, @Param("userId") Long userId);

    void insert(@Param("postId") Long postId, @Param("userId") Long userId);

    void delete(@Param("postId") Long postId, @Param("userId") Long userId);
}
