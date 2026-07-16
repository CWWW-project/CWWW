import api from './axios'
import type { ApiResponse } from '../types'

export interface UserMeResult {
  userId: number
  email: string | null
  nickname: string
  role: string
  provider: string | null
  createdAt: string
}

export const userApi = {
  getMe: () => api.get<ApiResponse<UserMeResult>>('/users/me'),
  updateMe: (nickname: string) =>
    api.patch<ApiResponse<UserMeResult>>('/users/me', { nickname }),
}
