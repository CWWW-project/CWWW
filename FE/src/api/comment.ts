import api from './axios'
import type { ApiResponse, CommentResponse } from '../types'

export interface CommentCreateBody {
  content: string
  parentCommentId?: number | null
}

export const commentApi = {
  getComments: (postId: number) =>
    api.get<ApiResponse<CommentResponse[]>>(`/posts/${postId}/comments`),

  createComment: (postId: number, body: CommentCreateBody) =>
    api.post<ApiResponse<void>>(`/posts/${postId}/comments`, body),

  deleteComment: (postId: number, commentId: number) =>
    api.delete<ApiResponse<void>>(`/posts/${postId}/comments/${commentId}`),
}
