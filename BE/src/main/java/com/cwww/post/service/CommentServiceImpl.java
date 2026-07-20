package com.cwww.post.service;

import com.cwww.global.exception.BusinessException;
import com.cwww.global.exception.ErrorCode;
import com.cwww.global.notification.dto.NotificationEvent;
import com.cwww.global.notification.redis.RedisNotificationPublisher;
import com.cwww.post.domain.Post;
import com.cwww.post.domain.PostComment;
import com.cwww.post.dto.CommentCreateRequest;
import com.cwww.post.dto.CommentResponse;
import com.cwww.post.mapper.CommentMapper;
import com.cwww.post.mapper.PostMapper;
import com.cwww.user.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CommentServiceImpl implements CommentService {

    private final CommentMapper commentMapper;
    private final PostMapper postMapper;
    private final UserMapper userMapper;
    private final RedisNotificationPublisher notificationPublisher;

    @Override
    @Transactional
    public void createComment(Long userId, Long postId, CommentCreateRequest request) {
        Post post = postMapper.findById(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));

        if (request.getParentCommentId() != null) {
            PostComment parent = commentMapper.findById(request.getParentCommentId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.COMMENT_NOT_FOUND));

            if (!parent.getPostId().equals(postId)) {
                throw new BusinessException(ErrorCode.COMMENT_NOT_FOUND);
            }
            if (parent.getParentCommentId() != null) {
                throw new BusinessException(ErrorCode.COMMENT_REPLY_DEPTH_EXCEEDED);
            }
        }

        PostComment comment = PostComment.builder()
                .postId(postId)
                .userId(userId)
                .parentCommentId(request.getParentCommentId())
                .content(request.getContent())
                .build();

        commentMapper.insert(comment);
        postMapper.incrementCommentCount(postId);

        if (!userId.equals(post.getUserId())) {
            String actorName = userMapper.findNicknameById(userId);
            NotificationEvent event = NotificationEvent.builder()
                    .eventType("COMMENT")
                    .targetUserId(post.getUserId())
                    .actorId(userId)
                    .actorName(actorName)
                    .targetId(postId)
                    .targetType("POST")
                    .preview(actorName + ": " + truncatePreview(request.getContent(), 30))
                    .createdAt(java.time.LocalDateTime.now())
                    .build();
            Runnable publish = () -> {
                try {
                    notificationPublisher.publish(event);
                } catch (Exception e) {
                    log.warn("댓글 알림 발행 실패: postId={}, userId={}", postId, userId, e);
                }
            };
            if (TransactionSynchronizationManager.isSynchronizationActive()) {
                TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                    @Override public void afterCommit() { publish.run(); }
                });
            } else {
                publish.run();
            }
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<CommentResponse> getComments(Long postId) {
        postMapper.findById(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));

        return commentMapper.findByPostId(postId).stream()
                .map(CommentResponse::from)
                .toList();
    }

    @Override
    @Transactional
    public void updateComment(Long userId, Long postId, Long commentId, String content) {
        PostComment comment = commentMapper.findById(commentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COMMENT_NOT_FOUND));

        if (!comment.getPostId().equals(postId)) {
            throw new BusinessException(ErrorCode.COMMENT_NOT_FOUND);
        }
        if (!comment.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.COMMENT_FORBIDDEN);
        }

        comment.setContent(content);
        commentMapper.update(comment);
    }

    @Override
    @Transactional
    public void deleteComment(Long userId, Long postId, Long commentId) {
        PostComment comment = commentMapper.findById(commentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COMMENT_NOT_FOUND));

        if (!comment.getPostId().equals(postId)) {
            throw new BusinessException(ErrorCode.COMMENT_NOT_FOUND);
        }

        Post post = postMapper.findById(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));

        if (!comment.getUserId().equals(userId) && !post.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.COMMENT_FORBIDDEN);
        }

        int deleted = commentMapper.softDelete(commentId);
        if (deleted == 1) {
            postMapper.decrementCommentCount(postId);
        }
    }

    private String truncatePreview(String content, int maxCodePoints) {
        int cpCount = content.codePointCount(0, content.length());
        if (cpCount <= maxCodePoints) {
            return content;
        }
        int end = content.offsetByCodePoints(0, maxCodePoints);
        return content.substring(0, end) + "...";
    }
}
