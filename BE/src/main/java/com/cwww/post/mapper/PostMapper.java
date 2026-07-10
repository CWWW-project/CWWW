package com.cwww.post.mapper;

import com.cwww.post.domain.Post;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface PostMapper {

    void insert(Post post);
}
