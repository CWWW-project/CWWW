package com.cwww.post.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Set;

@Mapper
public interface PostLikeMapper {

    boolean exists(@Param("postId") Long postId, @Param("userId") Long userId);

    Set<Long> findLikedPostIds(@Param("userId") Long userId, @Param("postIds") List<Long> postIds);

    void insert(@Param("postId") Long postId, @Param("userId") Long userId);

    int delete(@Param("postId") Long postId, @Param("userId") Long userId);
}
