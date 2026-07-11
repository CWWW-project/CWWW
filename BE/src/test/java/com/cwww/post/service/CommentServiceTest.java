package com.cwww.post.service;

import com.cwww.global.exception.BusinessException;
import com.cwww.global.exception.ErrorCode;
import com.cwww.post.domain.Post;
import com.cwww.post.domain.PostComment;
import com.cwww.post.dto.CommentCreateRequest;
import com.cwww.post.dto.CommentResponse;
import com.cwww.post.mapper.CommentMapper;
import com.cwww.post.mapper.PostMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class CommentServiceTest {

    @Mock private CommentMapper commentMapper;
    @Mock private PostMapper postMapper;

    @InjectMocks
    private CommentServiceImpl commentService;

    // ── 작성 ──────────────────────────────────────────

    @Test
    @DisplayName("댓글 작성 성공")
    void createComment_success() {
        // Arrange
        Long userId = 1L;
        Post post = Post.builder().postId(1L).userId(2L).build();
        CommentCreateRequest request = new CommentCreateRequest("댓글 내용", null);
        given(postMapper.findById(1L)).willReturn(Optional.of(post));

        // Act
        commentService.createComment(userId, 1L, request);

        // Assert
        verify(commentMapper).insert(org.mockito.ArgumentMatchers.any(PostComment.class));
        verify(postMapper).incrementCommentCount(1L);
    }

    @Test
    @DisplayName("대댓글 작성 성공")
    void createComment_reply_success() {
        // Arrange
        Long userId = 1L;
        Post post = Post.builder().postId(1L).userId(2L).build();
        PostComment parent = PostComment.builder().commentId(10L).postId(1L).build();
        CommentCreateRequest request = new CommentCreateRequest("대댓글 내용", 10L);
        given(postMapper.findById(1L)).willReturn(Optional.of(post));
        given(commentMapper.findById(10L)).willReturn(Optional.of(parent));

        // Act
        commentService.createComment(userId, 1L, request);

        // Assert
        verify(commentMapper).insert(org.mockito.ArgumentMatchers.any(PostComment.class));
    }

    @Test
    @DisplayName("댓글 작성 실패 - 게시글 없음")
    void createComment_postNotFound() {
        // Arrange
        given(postMapper.findById(99L)).willReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> commentService.createComment(1L, 99L, new CommentCreateRequest("내용", null)))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.POST_NOT_FOUND);
    }

    // ── 조회 ──────────────────────────────────────────

    @Test
    @DisplayName("댓글 목록 조회 성공")
    void getComments_success() {
        // Arrange
        List<PostComment> comments = List.of(
                PostComment.builder().commentId(1L).postId(1L).content("댓글1").build()
        );
        given(commentMapper.findByPostId(1L)).willReturn(comments);

        // Act
        List<CommentResponse> responses = commentService.getComments(1L);

        // Assert
        assertThat(responses).hasSize(1);
    }

    // ── 수정 ──────────────────────────────────────────

    @Test
    @DisplayName("댓글 수정 성공 - 본인")
    void updateComment_success() {
        // Arrange
        PostComment comment = PostComment.builder().commentId(1L).postId(1L).userId(1L).content("기존").build();
        given(commentMapper.findById(1L)).willReturn(Optional.of(comment));

        // Act
        commentService.updateComment(1L, 1L, "수정된 내용");

        // Assert
        verify(commentMapper).update(comment);
    }

    @Test
    @DisplayName("댓글 수정 실패 - 타인")
    void updateComment_forbidden() {
        // Arrange
        PostComment comment = PostComment.builder().commentId(1L).postId(1L).userId(1L).build();
        given(commentMapper.findById(1L)).willReturn(Optional.of(comment));

        // Act & Assert
        assertThatThrownBy(() -> commentService.updateComment(2L, 1L, "수정"))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.COMMENT_FORBIDDEN);
    }

    // ── 삭제 ──────────────────────────────────────────

    @Test
    @DisplayName("댓글 삭제 성공 - 댓글 작성자")
    void deleteComment_byCommentOwner() {
        // Arrange
        PostComment comment = PostComment.builder().commentId(1L).postId(1L).userId(1L).build();
        Post post = Post.builder().postId(1L).userId(2L).build();
        given(commentMapper.findById(1L)).willReturn(Optional.of(comment));
        given(postMapper.findById(1L)).willReturn(Optional.of(post));

        // Act
        commentService.deleteComment(1L, 1L);

        // Assert
        verify(commentMapper).softDelete(1L);
        verify(postMapper).decrementCommentCount(1L);
    }

    @Test
    @DisplayName("댓글 삭제 성공 - 게시글 작성자")
    void deleteComment_byPostOwner() {
        // Arrange
        PostComment comment = PostComment.builder().commentId(1L).postId(1L).userId(3L).build();
        Post post = Post.builder().postId(1L).userId(2L).build();
        given(commentMapper.findById(1L)).willReturn(Optional.of(comment));
        given(postMapper.findById(1L)).willReturn(Optional.of(post));

        // Act
        commentService.deleteComment(2L, 1L);

        // Assert
        verify(commentMapper).softDelete(1L);
        verify(postMapper).decrementCommentCount(1L);
    }

    @Test
    @DisplayName("댓글 삭제 실패 - 타인")
    void deleteComment_forbidden() {
        // Arrange
        PostComment comment = PostComment.builder().commentId(1L).postId(1L).userId(1L).build();
        Post post = Post.builder().postId(1L).userId(2L).build();
        given(commentMapper.findById(1L)).willReturn(Optional.of(comment));
        given(postMapper.findById(1L)).willReturn(Optional.of(post));

        // Act & Assert
        assertThatThrownBy(() -> commentService.deleteComment(3L, 1L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.COMMENT_FORBIDDEN);
    }
}
