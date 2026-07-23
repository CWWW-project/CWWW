import api from './axios'
import type { ApiResponse } from '../types'

export const adminBgmApi = {
  syncBgm: (limit: number) =>
    api.post<ApiResponse<number>>('/admin/bgm/sync', null, { params: { limit } }),
}