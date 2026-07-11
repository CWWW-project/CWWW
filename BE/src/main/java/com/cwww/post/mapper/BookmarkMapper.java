package com.cwww.post.mapper;

import com.cwww.post.domain.Post;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface BookmarkMapper {

    boolean exists(@Param("postId") Long postId, @Param("userId") Long userId);

    void insert(@Param("postId") Long postId, @Param("userId") Long userId);

    int delete(@Param("postId") Long postId, @Param("userId") Long userId);

    List<Post> findBookmarkedPosts(@Param("userId") Long userId,
                                   @Param("cursor") Long cursor,
                                   @Param("size") int size);
}
