import api from './axios'
import type { ApiResponse } from '../types'

export interface LoginBody {
  email: string
  password: string
}

export interface SignupBody {
  email: string
  password: string
  nickname: string
}

export interface LoginResult {
  accessToken: string
  refreshToken: string
  userId: number
  nickname: string
}

export interface SignupResult {
  userId: number
  email: string
  nickname: string
}

export interface OAuthTokenResult {
  accessToken: string
  userId: number
  nickname: string
}

export const authApi = {
  login: (body: LoginBody) =>
    api.post<ApiResponse<LoginResult>>('/auth/login', body),

  signup: (body: SignupBody) =>
    api.post<ApiResponse<SignupResult>>('/auth/signup', body),

  exchangeOAuthCode: (code: string) =>
    api.post<ApiResponse<OAuthTokenResult>>('/auth/oauth/token', { code }),
}
