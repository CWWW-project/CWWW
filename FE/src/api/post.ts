import api from './axios'
import type { ApiResponse, FeedResponse, PostResponse } from '../types'

export interface PostCreateBody {
  minihompyId?: number
  title: string
  content: string
  visibility: 'ALL' | 'FRIEND' | 'PRIVATE'
  hashtags: string[]
  mediaUrls: string[]
}

export interface PostUpdateBody {
  title: string
  content: string
  visibility: 'ALL' | 'FRIEND' | 'PRIVATE'
  hashtags: string[]
}

export const postApi = {
  getFeed: (cursor?: number, size = 10) =>
    api.get<ApiResponse<FeedResponse>>('/posts/feed', { params: { cursor, size } }),

  getPost: (postId: number) =>
    api.get<ApiResponse<PostResponse>>(`/posts/${postId}`),

  createPost: (body: PostCreateBody) =>
    api.post<ApiResponse<PostResponse>>('/posts', body),

  updatePost: (postId: number, body: PostUpdateBody) =>
    api.patch<ApiResponse<void>>(`/posts/${postId}`, body),

  deletePost: (postId: number) =>
    api.delete<ApiResponse<void>>(`/posts/${postId}`),

  likePost: (postId: number) =>
    api.post<ApiResponse<void>>(`/posts/${postId}/like`),

  unlikePost: (postId: number) =>
    api.delete<ApiResponse<void>>(`/posts/${postId}/like`),

  searchByHashtag: (tag: string, cursor?: number, size = 10) =>
    api.get<ApiResponse<FeedResponse>>('/posts/search', { params: { tag, cursor, size } }),

  bookmark: (postId: number) =>
    api.post<ApiResponse<void>>(`/posts/${postId}/bookmark`),

  unbookmark: (postId: number) =>
    api.delete<ApiResponse<void>>(`/posts/${postId}/bookmark`),

  getBookmarks: (cursor?: number, size = 10) =>
    api.get<ApiResponse<FeedResponse>>('/posts/bookmarks', { params: { cursor, size } }),

  uploadImages: (files: File[]) => {
    const form = new FormData()
    files.forEach(f => form.append('files', f))
    return api.post<ApiResponse<string[]>>('/media/upload', form)
  },

  getUserPosts: (userId: number, cursor?: number, size = 10) =>
  api.get<ApiResponse<FeedResponse>>(`/posts/user/${userId}`, { params: { cursor, size } }),
}
