package com.cwww.post.service;

import com.cwww.friend.mapper.FriendMapper;
import com.cwww.global.exception.BusinessException;
import com.cwww.global.exception.ErrorCode;
import com.cwww.post.domain.Post;
import com.cwww.post.dto.PostResponse;
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
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class PostGetServiceTest {

    @Mock private PostMapper postMapper;
    @Mock private MediaMapper mediaMapper;
    @Mock private HashtagMapper hashtagMapper;
    @Mock private FriendMapper friendMapper;
    @Mock private UserMapper userMapper;

    @InjectMocks
    private PostServiceImpl postService;

    @Test
    @DisplayName("전체 공개 게시글 조회 성공")
    void getPost_public_success() {
        // Arrange
        Long viewerId = 2L;
        Post post = Post.builder().postId(1L).userId(1L).title("제목").content("내용").visibility("ALL").build();
        given(postMapper.findById(1L)).willReturn(Optional.of(post));
        given(userMapper.findNicknameById(anyLong())).willReturn("작성자");
        given(mediaMapper.findUrlsByTarget("POST", 1L)).willReturn(List.of());
        given(hashtagMapper.findNamesByPostId(1L)).willReturn(List.of());

        // Act
        PostResponse response = postService.getPost(viewerId, 1L);

        // Assert
        assertThat(response.getPostId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("존재하지 않는 게시글 조회 시 예외")
    void getPost_notFound() {
        // Arrange
        given(postMapper.findById(99L)).willReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> postService.getPost(1L, 99L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.POST_NOT_FOUND);
    }

    @Test
    @DisplayName("일촌 공개 글 - 일촌이 아닌 경우 예외")
    void getPost_friendOnly_forbidden() {
        // Arrange
        Long viewerId = 2L;
        Post post = Post.builder().postId(1L).userId(1L).visibility("FRIEND").build();
        given(postMapper.findById(1L)).willReturn(Optional.of(post));
        given(friendMapper.isFriend(1L, viewerId)).willReturn(false);

        // Act & Assert
        assertThatThrownBy(() -> postService.getPost(viewerId, 1L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.POST_FORBIDDEN);
    }

    @Test
    @DisplayName("비공개 글 - 작성자 본인은 조회 가능")
    void getPost_private_owner_success() {
        // Arrange
        Long ownerId = 1L;
        Post post = Post.builder().postId(1L).userId(1L).title("비공개").content("내용").visibility("PRIVATE").build();
        given(postMapper.findById(1L)).willReturn(Optional.of(post));
        given(userMapper.findNicknameById(anyLong())).willReturn("작성자");
        given(mediaMapper.findUrlsByTarget("POST", 1L)).willReturn(List.of());
        given(hashtagMapper.findNamesByPostId(1L)).willReturn(List.of());

        // Act
        PostResponse response = postService.getPost(ownerId, 1L);

        // Assert
        assertThat(response.getPostId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("일촌 공개 글 - 일촌인 경우 조회 성공")
    void getPost_friendOnly_success() {
        // Arrange
        Long viewerId = 2L;
        Post post = Post.builder().postId(1L).userId(1L).title("일촌글").content("내용").visibility("FRIEND").build();
        given(postMapper.findById(1L)).willReturn(Optional.of(post));
        given(friendMapper.isFriend(1L, viewerId)).willReturn(true);
        given(userMapper.findNicknameById(anyLong())).willReturn("작성자");
        given(mediaMapper.findUrlsByTarget("POST", 1L)).willReturn(List.of());
        given(hashtagMapper.findNamesByPostId(1L)).willReturn(List.of());

        // Act
        PostResponse response = postService.getPost(viewerId, 1L);

        // Assert
        assertThat(response.getPostId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("비공개 글 - 타인 조회 시 예외")
    void getPost_private_forbidden() {
        // Arrange
        Long viewerId = 2L;
        Post post = Post.builder().postId(1L).userId(1L).visibility("PRIVATE").build();
        given(postMapper.findById(1L)).willReturn(Optional.of(post));

        // Act & Assert
        assertThatThrownBy(() -> postService.getPost(viewerId, 1L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.POST_FORBIDDEN);
    }
}
