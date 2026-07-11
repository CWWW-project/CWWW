package com.cwww.post.service;

import com.cwww.post.dto.CommentCreateRequest;
import com.cwww.post.dto.CommentResponse;

import java.util.List;

public interface CommentService {

    void createComment(Long userId, Long postId, CommentCreateRequest request);

    List<CommentResponse> getComments(Long postId);

    void updateComment(Long userId, Long commentId, String content);

    void deleteComment(Long userId, Long commentId);
}
