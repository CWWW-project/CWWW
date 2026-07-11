package com.cwww.post.service;

import com.cwww.global.exception.BusinessException;
import com.cwww.global.exception.ErrorCode;
import com.cwww.post.domain.Post;
import com.cwww.post.domain.PostComment;
import com.cwww.post.dto.CommentCreateRequest;
import com.cwww.post.dto.CommentResponse;
import com.cwww.post.mapper.CommentMapper;
import com.cwww.post.mapper.PostMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CommentServiceImpl implements CommentService {

    private final CommentMapper commentMapper;
    private final PostMapper postMapper;

    @Override
    @Transactional
    public void createComment(Long userId, Long postId, CommentCreateRequest request) {
        postMapper.findById(postId)
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
    }

    @Override
    @Transactional(readOnly = true)
    public List<CommentResponse> getComments(Long postId) {
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
}
