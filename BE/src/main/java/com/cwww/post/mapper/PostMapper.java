package com.cwww.post.mapper;

import com.cwww.post.domain.Post;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Optional;

@Mapper
public interface PostMapper {

    void insert(Post post);

    Optional<Post> findById(Long postId);

    void incrementViewCount(Long postId);

    void update(Post post);

    void softDelete(Long postId);

    List<Post> findFeed(@Param("viewerId") Long viewerId, @Param("cursor") Long cursor, @Param("size") int size);

    void incrementLikeCount(Long postId);

    void decrementLikeCount(Long postId);

    void incrementCommentCount(Long postId);

    void decrementCommentCount(Long postId);

    List<Post> findByHashtag(@Param("tag") String tag,
                             @Param("cursor") Long cursor,
                             @Param("size") int size);
}
