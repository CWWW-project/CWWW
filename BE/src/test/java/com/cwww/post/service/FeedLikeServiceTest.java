package com.cwww.post.service;

import com.cwww.global.exception.BusinessException;
import com.cwww.global.exception.ErrorCode;
import com.cwww.global.notification.dto.NotificationEvent;
import com.cwww.global.notification.redis.RedisNotificationPublisher;
import com.cwww.post.domain.Post;
import com.cwww.post.dto.FeedResponse;
import com.cwww.friend.mapper.FriendMapper;
import com.cwww.post.mapper.BookmarkMapper;
import com.cwww.post.mapper.HashtagMapper;
import com.cwww.post.mapper.MediaMapper;
import com.cwww.post.mapper.PostLikeMapper;
import com.cwww.post.mapper.PostMapper;
import com.cwww.user.domain.User;
import com.cwww.user.mapper.UserMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class FeedLikeServiceTest {

    @Mock private PostMapper postMapper;
    @Mock private PostLikeMapper postLikeMapper;
    @Mock private BookmarkMapper bookmarkMapper;
    @Mock private UserMapper userMapper;
    @Mock private HashtagMapper hashtagMapper;
    @Mock private MediaMapper mediaMapper;
    @Mock private FriendMapper friendMapper;
    @Mock private RedisNotificationPublisher notificationPublisher;

    @InjectMocks
    private PostServiceImpl postService;

    // ── 피드 조회 ──────────────────────────────────────────

    @Test
    @DisplayName("피드 조회 성공 - 결과 있음")
    void getFeed_success() {
        // Arrange
        Long viewerId = 1L;
        List<Post> posts = List.of(
                Post.builder().postId(2L).userId(2L).title("글2").visibility("ALL").build(),
                Post.builder().postId(1L).userId(2L).title("글1").visibility("ALL").build()
        );
        given(postMapper.findFeed(viewerId, null, 11)).willReturn(posts);
        given(userMapper.findByIds(anyList())).willReturn(List.of(
                User.builder().userId(2L).nickname("작성자").build()
        ));
        given(hashtagMapper.findAllByPostIds(anyList())).willReturn(List.of());
        given(mediaMapper.findAllByTargets(anyString(), anyList())).willReturn(List.of());

        // Act
        FeedResponse response = postService.getFeed(viewerId, null, 10);

        // Assert
        assertThat(response.getPosts()).hasSize(2);
        assertThat(response.isHasNext()).isFalse();
    }

    @Test
    @DisplayName("피드 조회 성공 - 빈 결과")
    void getFeed_empty() {
        // Arrange
        given(postMapper.findFeed(1L, null, 11)).willReturn(List.of());

        // Act
        FeedResponse response = postService.getFeed(1L, null, 10);

        // Assert
        assertThat(response.getPosts()).isEmpty();
        assertThat(response.isHasNext()).isFalse();
    }

    // ── 좋아요 ──────────────────────────────────────────

    @Test
    @DisplayName("좋아요 등록 성공")
    void likePost_success() {
        // Arrange
        Long userId = 1L;
        Post post = Post.builder().postId(1L).userId(2L).build();
        given(postMapper.findById(1L)).willReturn(Optional.of(post));
        given(postLikeMapper.exists(1L, userId)).willReturn(false);
        given(userMapper.findNicknameById(anyLong())).willReturn("테스터");

        // Act
        postService.likePost(userId, 1L);

        // Assert
        verify(postLikeMapper).insert(1L, userId);
        verify(postMapper).incrementLikeCount(1L);
        verify(notificationPublisher).publish(any(NotificationEvent.class));
    }

    @Test
    @DisplayName("좋아요 등록 실패 - 이미 좋아요")
    void likePost_alreadyLiked() {
        // Arrange
        Long userId = 1L;
        Post post = Post.builder().postId(1L).userId(2L).build();
        given(postMapper.findById(1L)).willReturn(Optional.of(post));
        given(postLikeMapper.exists(1L, userId)).willReturn(true);

        // Act & Assert
        assertThatThrownBy(() -> postService.likePost(userId, 1L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.ALREADY_LIKED);
    }

    @Test
    @DisplayName("좋아요 취소 성공")
    void unlikePost_success() {
        // Arrange
        Long userId = 1L;
        Post post = Post.builder().postId(1L).userId(2L).build();
        given(postMapper.findById(1L)).willReturn(Optional.of(post));
        given(postLikeMapper.exists(1L, userId)).willReturn(true);
        given(postLikeMapper.delete(1L, userId)).willReturn(1);

        // Act
        postService.unlikePost(userId, 1L);

        // Assert
        verify(postMapper).decrementLikeCount(1L);
    }

    @Test
    @DisplayName("좋아요 취소 실패 - 좋아요 안 한 상태")
    void unlikePost_notLiked() {
        // Arrange
        Long userId = 1L;
        Post post = Post.builder().postId(1L).userId(2L).build();
        given(postMapper.findById(1L)).willReturn(Optional.of(post));
        given(postLikeMapper.exists(1L, userId)).willReturn(false);

        // Act & Assert
        assertThatThrownBy(() -> postService.unlikePost(userId, 1L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.NOT_LIKED);
    }
}
