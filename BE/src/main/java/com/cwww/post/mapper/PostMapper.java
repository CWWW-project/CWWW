package com.cwww.post.mapper;

import com.cwww.post.domain.Post;
import org.apache.ibatis.annotations.Mapper;

import java.util.Optional;

@Mapper
public interface PostMapper {

    void insert(Post post);

    Optional<Post> findById(Long postId);

    void incrementViewCount(Long postId);
}
