package com.cwww.post.mapper;

import com.cwww.post.domain.Hashtag;
import com.cwww.post.dto.PostHashtagDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface HashtagMapper {

    void upsertHashtag(String name);

    Hashtag findByName(String name);

    void linkToPost(@Param("postId") Long postId, @Param("hashtagId") Long hashtagId);

    List<String> findNamesByPostId(Long postId);

    List<PostHashtagDto> findAllByPostIds(@Param("postIds") List<Long> postIds);

    void deleteByPostId(Long postId);
}
