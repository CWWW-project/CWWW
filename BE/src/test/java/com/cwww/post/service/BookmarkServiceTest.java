package com.cwww.post.service;

import com.cwww.global.exception.BusinessException;
import com.cwww.global.exception.ErrorCode;
import com.cwww.post.domain.Post;
import com.cwww.post.dto.FeedResponse;
import com.cwww.post.mapper.BookmarkMapper;
import com.cwww.post.mapper.HashtagMapper;
import com.cwww.post.mapper.MediaMapper;
import com.cwww.post.mapper.PostMapper;
import com.cwww.user.mapper.UserMapper;
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
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class BookmarkServiceTest {

    @Mock private PostMapper postMapper;
    @Mock private BookmarkMapper bookmarkMapper;
    @Mock private UserMapper userMapper;
    @Mock private HashtagMapper hashtagMapper;
    @Mock private MediaMapper mediaMapper;

    @InjectMocks
    private BookmarkServiceImpl bookmarkService;

    // ── 북마크 등록 ──────────────────────────────────────────

    @Test
    @DisplayName("북마크 등록 성공")
    void bookmark_success() {
        // Arrange
        Long userId = 1L;
        Post post = Post.builder().postId(1L).userId(2L).build();
        given(postMapper.findById(1L)).willReturn(Optional.of(post));
        given(bookmarkMapper.insert(1L, userId)).willReturn(1);

        // Act
        bookmarkService.bookmark(userId, 1L);

        // Assert
        verify(bookmarkMapper).insert(1L, userId);
    }

    @Test
    @DisplayName("북마크 등록 실패 - 이미 북마크")
    void bookmark_alreadyBookmarked() {
        // Arrange
        Long userId = 1L;
        Post post = Post.builder().postId(1L).userId(2L).build();
        given(postMapper.findById(1L)).willReturn(Optional.of(post));
        given(bookmarkMapper.insert(1L, userId)).willReturn(0);

        // Act & Assert
        assertThatThrownBy(() -> bookmarkService.bookmark(userId, 1L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.ALREADY_BOOKMARKED);
    }

    @Test
    @DisplayName("북마크 등록 실패 - 게시글 없음")
    void bookmark_postNotFound() {
        // Arrange
        given(postMapper.findById(99L)).willReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> bookmarkService.bookmark(1L, 99L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.POST_NOT_FOUND);
    }

    // ── 북마크 취소 ──────────────────────────────────────────

    @Test
    @DisplayName("북마크 취소 성공")
    void unbookmark_success() {
        // Arrange
        Long userId = 1L;
        given(bookmarkMapper.delete(1L, userId)).willReturn(1);

        // Act
        bookmarkService.unbookmark(userId, 1L);

        // Assert
        verify(bookmarkMapper).delete(1L, userId);
    }

    @Test
    @DisplayName("북마크 취소 성공 - 소프트 삭제된 게시글")
    void unbookmark_softDeletedPost() {
        // Arrange
        Long userId = 1L;
        given(bookmarkMapper.delete(1L, userId)).willReturn(1);

        // Act
        bookmarkService.unbookmark(userId, 1L);

        // Assert
        verify(bookmarkMapper).delete(1L, userId);
    }

    @Test
    @DisplayName("북마크 취소 실패 - 북마크 안 한 상태")
    void unbookmark_notBookmarked() {
        // Arrange
        Long userId = 1L;
        given(bookmarkMapper.delete(1L, userId)).willReturn(0);

        // Act & Assert
        assertThatThrownBy(() -> bookmarkService.unbookmark(userId, 1L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.NOT_BOOKMARKED);
    }

    // ── 북마크 목록 조회 ──────────────────────────────────────────

    @Test
    @DisplayName("북마크 목록 조회 성공 - 결과 있음")
    void getBookmarks_success() {
        // Arrange
        Long userId = 1L;
        List<Post> posts = List.of(
                Post.builder().postId(2L).userId(2L).title("글2").visibility("ALL").build(),
                Post.builder().postId(1L).userId(2L).title("글1").visibility("ALL").build()
        );
        given(bookmarkMapper.findBookmarkedPosts(userId, null, 11)).willReturn(posts);
        given(userMapper.findNicknameById(anyLong())).willReturn("작성자");
        given(hashtagMapper.findNamesByPostId(anyLong())).willReturn(List.of());
        given(mediaMapper.findUrlsByTarget(anyString(), anyLong())).willReturn(List.of());

        // Act
        FeedResponse response = bookmarkService.getBookmarks(userId, null, 10);

        // Assert
        assertThat(response.getPosts()).hasSize(2);
        assertThat(response.isHasNext()).isFalse();
    }

    @Test
    @DisplayName("북마크 목록 조회 성공 - 다음 페이지 있음")
    void getBookmarks_hasNext() {
        // Arrange
        Long userId = 1L;
        List<Post> posts = List.of(
                Post.builder().postId(11L).userId(2L).title("글11").visibility("ALL").build(),
                Post.builder().postId(10L).userId(2L).title("글10").visibility("ALL").build(),
                Post.builder().postId(9L).userId(2L).title("글9").visibility("ALL").build(),
                Post.builder().postId(8L).userId(2L).title("글8").visibility("ALL").build(),
                Post.builder().postId(7L).userId(2L).title("글7").visibility("ALL").build(),
                Post.builder().postId(6L).userId(2L).title("글6").visibility("ALL").build(),
                Post.builder().postId(5L).userId(2L).title("글5").visibility("ALL").build(),
                Post.builder().postId(4L).userId(2L).title("글4").visibility("ALL").build(),
                Post.builder().postId(3L).userId(2L).title("글3").visibility("ALL").build(),
                Post.builder().postId(2L).userId(2L).title("글2").visibility("ALL").build(),
                Post.builder().postId(1L).userId(2L).title("글1").visibility("ALL").build()
        );
        given(bookmarkMapper.findBookmarkedPosts(userId, null, 11)).willReturn(posts);
        given(userMapper.findNicknameById(anyLong())).willReturn("작성자");
        given(hashtagMapper.findNamesByPostId(anyLong())).willReturn(List.of());
        given(mediaMapper.findUrlsByTarget(anyString(), anyLong())).willReturn(List.of());

        // Act
        FeedResponse response = bookmarkService.getBookmarks(userId, null, 10);

        // Assert
        assertThat(response.getPosts()).hasSize(10);
        assertThat(response.isHasNext()).isTrue();
        assertThat(response.getNextCursor()).isEqualTo(2L);
    }
}
