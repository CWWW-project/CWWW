package com.cwww.post.mapper;

import com.cwww.post.domain.Post;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface BookmarkMapper {

    int insert(@Param("postId") Long postId, @Param("userId") Long userId);

    int delete(@Param("postId") Long postId, @Param("userId") Long userId);

    List<Post> findBookmarkedPosts(@Param("userId") Long userId,
                                   @Param("cursor") Long cursor,
                                   @Param("size") int size);

    java.util.Set<Long> findBookmarkedPostIds(@Param("userId") Long userId,
                                              @Param("postIds") List<Long> postIds);
}
