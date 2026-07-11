package com.cwww.post.service;

import com.cwww.post.domain.Hashtag;
import com.cwww.post.domain.Post;
import com.cwww.post.dto.PostCreateRequest;
import com.cwww.post.dto.PostResponse;
import com.cwww.post.mapper.HashtagMapper;
import com.cwww.post.mapper.MediaMapper;
import com.cwww.post.mapper.PostMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class PostServiceTest {

    @Mock private PostMapper postMapper;
    @Mock private MediaMapper mediaMapper;
    @Mock private HashtagMapper hashtagMapper;

    @InjectMocks
    private PostServiceImpl postService;

    @Test
    @DisplayName("다이어리 작성 성공 - 해시태그/미디어 없음")
    void createPost_success() {
        // Arrange
        Long userId = 1L;
        PostCreateRequest request = new PostCreateRequest();
        request.setTitle("오늘 일기");
        request.setContent("오늘은 맑았다");
        request.setVisibility("ALL");

        doAnswer(invocation -> {
            Post post = invocation.getArgument(0);
            post.setPostId(1L);
            post.setCreatedAt(LocalDateTime.now());
            return null;
        }).when(postMapper).insert(any(Post.class));

        // Act
        PostResponse response = postService.createPost(userId, request);

        // Assert
        assertThat(response.getTitle()).isEqualTo("오늘 일기");
        assertThat(response.getContent()).isEqualTo("오늘은 맑았다");
        assertThat(response.getVisibility()).isEqualTo("ALL");
        assertThat(response.getUserId()).isEqualTo(userId);
        verify(postMapper).insert(any(Post.class));
    }

    @Test
    @DisplayName("다이어리 작성 성공 - 해시태그 포함")
    void createPost_withHashtags_success() {
        // Arrange
        Long userId = 1L;
        PostCreateRequest request = new PostCreateRequest();
        request.setTitle("해시태그 일기");
        request.setContent("내용");
        request.setVisibility("ALL");
        request.setHashtags(List.of("일상", "맑음"));

        doAnswer(invocation -> {
            Post post = invocation.getArgument(0);
            post.setPostId(1L);
            post.setCreatedAt(LocalDateTime.now());
            return null;
        }).when(postMapper).insert(any(Post.class));

        given(hashtagMapper.upsertAndGet("일상")).willReturn(new Hashtag(1L, "일상"));
        given(hashtagMapper.upsertAndGet("맑음")).willReturn(new Hashtag(2L, "맑음"));

        // Act
        PostResponse response = postService.createPost(userId, request);

        // Assert
        assertThat(response.getHashtags()).containsExactly("일상", "맑음");
        verify(hashtagMapper).upsertAndGet("일상");
        verify(hashtagMapper).upsertAndGet("맑음");
    }
}
