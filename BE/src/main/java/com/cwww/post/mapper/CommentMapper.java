package com.cwww.post.mapper;

import com.cwww.post.domain.PostComment;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;
import java.util.Optional;

@Mapper
public interface CommentMapper {

    void insert(PostComment comment);

    Optional<PostComment> findById(Long commentId);

    List<PostComment> findByPostId(Long postId);

    void update(PostComment comment);

    int softDelete(Long commentId);
}
