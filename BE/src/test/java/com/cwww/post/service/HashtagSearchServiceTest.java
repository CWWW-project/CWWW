package com.cwww.post.service;

import com.cwww.post.domain.Post;
import com.cwww.post.dto.FeedResponse;
import com.cwww.post.mapper.HashtagMapper;
import com.cwww.post.mapper.MediaMapper;
import com.cwww.post.mapper.PostLikeMapper;
import com.cwww.post.mapper.PostMapper;
import com.cwww.user.domain.User;
import com.cwww.user.mapper.UserMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
class HashtagSearchServiceTest {

    @Mock private PostMapper postMapper;
    @Mock private UserMapper userMapper;
    @Mock private HashtagMapper hashtagMapper;
    @Mock private MediaMapper mediaMapper;
    @Mock private PostLikeMapper postLikeMapper;

    @InjectMocks
    private PostServiceImpl postService;

    @Test
    @DisplayName("해시태그 검색 성공 - 결과 있음")
    void searchByHashtag_success() {
        // Arrange
        List<Post> posts = List.of(
                Post.builder().postId(2L).userId(1L).title("글2").visibility("ALL").build(),
                Post.builder().postId(1L).userId(1L).title("글1").visibility("ALL").build()
        );
        given(postMapper.findByHashtag("일상", null, 11)).willReturn(posts);
        given(userMapper.findByIds(anyList())).willReturn(List.of(
                User.builder().userId(1L).nickname("작성자").build()
        ));
        given(hashtagMapper.findAllByPostIds(anyList())).willReturn(List.of());
        given(mediaMapper.findAllByTargets(anyString(), anyList())).willReturn(List.of());

        // Act
        FeedResponse response = postService.searchByHashtag(null, "일상", null, 10);

        // Assert
        assertThat(response.getPosts()).hasSize(2);
        assertThat(response.isHasNext()).isFalse();
    }

    @Test
    @DisplayName("해시태그 검색 성공 - 빈 결과")
    void searchByHashtag_empty() {
        // Arrange
        given(postMapper.findByHashtag("없는태그", null, 11)).willReturn(List.of());

        // Act
        FeedResponse response = postService.searchByHashtag(null, "없는태그", null, 10);

        // Assert
        assertThat(response.getPosts()).isEmpty();
        assertThat(response.isHasNext()).isFalse();
        assertThat(response.getNextCursor()).isNull();
    }

    @Test
    @DisplayName("해시태그 검색 성공 - 다음 페이지 있음")
    void searchByHashtag_hasNext() {
        // Arrange
        List<Post> posts = List.of(
                Post.builder().postId(11L).userId(1L).visibility("ALL").build(),
                Post.builder().postId(10L).userId(1L).visibility("ALL").build(),
                Post.builder().postId(9L).userId(1L).visibility("ALL").build(),
                Post.builder().postId(8L).userId(1L).visibility("ALL").build(),
                Post.builder().postId(7L).userId(1L).visibility("ALL").build(),
                Post.builder().postId(6L).userId(1L).visibility("ALL").build(),
                Post.builder().postId(5L).userId(1L).visibility("ALL").build(),
                Post.builder().postId(4L).userId(1L).visibility("ALL").build(),
                Post.builder().postId(3L).userId(1L).visibility("ALL").build(),
                Post.builder().postId(2L).userId(1L).visibility("ALL").build(),
                Post.builder().postId(1L).userId(1L).visibility("ALL").build()
        );
        given(postMapper.findByHashtag("일상", null, 11)).willReturn(posts);
        given(userMapper.findByIds(anyList())).willReturn(List.of(
                User.builder().userId(1L).nickname("작성자").build()
        ));
        given(hashtagMapper.findAllByPostIds(anyList())).willReturn(List.of());
        given(mediaMapper.findAllByTargets(anyString(), anyList())).willReturn(List.of());

        // Act
        FeedResponse response = postService.searchByHashtag(null, "일상", null, 10);

        // Assert
        assertThat(response.getPosts()).hasSize(10);
        assertThat(response.isHasNext()).isTrue();
        assertThat(response.getNextCursor()).isEqualTo(2L);
    }
}
