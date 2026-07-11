package com.cwww.post.service;

import com.cwww.global.exception.BusinessException;
import com.cwww.global.exception.ErrorCode;
import com.cwww.post.domain.Post;
import com.cwww.post.dto.PostUpdateRequest;
import com.cwww.post.mapper.HashtagMapper;
import com.cwww.post.mapper.PostMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class PostUpdateDeleteServiceTest {

    @Mock private PostMapper postMapper;
    @Mock private HashtagMapper hashtagMapper;

    @InjectMocks
    private PostServiceImpl postService;

    // ── 수정 ──────────────────────────────────────────

    @Test
    @DisplayName("수정 성공 - 본인")
    void updatePost_success() {
        // Arrange
        Long userId = 1L;
        Post post = Post.builder().postId(1L).userId(1L).visibility("ALL").build();
        PostUpdateRequest request = new PostUpdateRequest("새 제목", "새 내용", "FRIEND", List.of());
        given(postMapper.findById(1L)).willReturn(Optional.of(post));

        // Act
        postService.updatePost(userId, 1L, request);

        // Assert
        verify(postMapper).update(post);
    }

    @Test
    @DisplayName("수정 실패 - 게시글 없음")
    void updatePost_notFound() {
        // Arrange
        given(postMapper.findById(99L)).willReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> postService.updatePost(1L, 99L, new PostUpdateRequest("제목", "내용", "ALL", List.of())))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.POST_NOT_FOUND);
    }

    @Test
    @DisplayName("수정 실패 - 타인")
    void updatePost_forbidden() {
        // Arrange
        Post post = Post.builder().postId(1L).userId(1L).build();
        given(postMapper.findById(1L)).willReturn(Optional.of(post));

        // Act & Assert
        assertThatThrownBy(() -> postService.updatePost(2L, 1L, new PostUpdateRequest("제목", "내용", "ALL", List.of())))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.POST_FORBIDDEN);
    }

    // ── 삭제 ──────────────────────────────────────────

    @Test
    @DisplayName("삭제 성공 - 본인")
    void deletePost_success() {
        // Arrange
        Long userId = 1L;
        Post post = Post.builder().postId(1L).userId(1L).build();
        given(postMapper.findById(1L)).willReturn(Optional.of(post));

        // Act
        postService.deletePost(userId, 1L);

        // Assert
        verify(postMapper).softDelete(1L);
    }

    @Test
    @DisplayName("삭제 실패 - 게시글 없음")
    void deletePost_notFound() {
        // Arrange
        given(postMapper.findById(99L)).willReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> postService.deletePost(1L, 99L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.POST_NOT_FOUND);
    }

    @Test
    @DisplayName("삭제 실패 - 타인")
    void deletePost_forbidden() {
        // Arrange
        Post post = Post.builder().postId(1L).userId(1L).build();
        given(postMapper.findById(1L)).willReturn(Optional.of(post));

        // Act & Assert
        assertThatThrownBy(() -> postService.deletePost(2L, 1L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.POST_FORBIDDEN);
    }
}
