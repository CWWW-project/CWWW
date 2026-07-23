import api from './axios'
import type { ApiResponse } from '../types'

export const userApi = {
  withdraw: (password: string) =>
    api.delete<ApiResponse<null>>('/users/me', { data: { password } }),
}
