package com.cwww.post.mapper;

import com.cwww.post.domain.Hashtag;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface HashtagMapper {

    void upsertHashtag(String name);

    Hashtag findByName(String name);

    void linkToPost(@Param("postId") Long postId, @Param("hashtagId") Long hashtagId);
}
