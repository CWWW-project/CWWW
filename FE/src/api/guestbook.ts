import api from './axios'
import type { ApiResponse, GuestbookFeedResponse } from '../types'

export interface GuestbookCreateBody {
  content: string
  isSecret: boolean
}

export interface GuestbookUpdateBody {
  content: string
  isSecret?: boolean   // Boolean wrapper라 안 보내면 서버에서 "값 안 바꿈"으로 처리
}

export const guestbookApi = {
  // 방명록 작성
  create: (ownerId: number, body: GuestbookCreateBody) =>
    api.post<ApiResponse<void>>(`/guestbooks/${ownerId}`, body),

  // 방명록 목록 조회 (커서 기반 페이징)
  getList: (ownerId: number, cursor?: number, size = 4) =>
    api.get<ApiResponse<GuestbookFeedResponse>>(`/guestbooks/${ownerId}`, { params: { cursor, size } }),

  // 방명록 수정 (작성자 본인만)
  update: (guestbookId: number, body: GuestbookUpdateBody) =>
    api.patch<ApiResponse<void>>(`/guestbooks/${guestbookId}`, body),

  // 방명록 삭제 (작성자 본인 또는 홈피 주인)
  delete: (ownerId: number, guestbookId: number) =>
    api.delete<ApiResponse<void>>(`/guestbooks/${ownerId}/${guestbookId}`),
}