import api from './axios'
import type {
  ApiResponse,
  MinihompyMainResponse,
  ProfileImageResponse,
  BgmOptionResponse,
  BgmApplyResponse,
  BackgroundResponse,
  BackgroundDotOptionResponse,
  AccessLevel,
  VisitorLogResponse,
} from '../types'

export interface MinihompySettingsRequest {
  accessLevel: AccessLevel
  introduction?: string
  mood?: string
}


export const minihompyApi = {

  // ── 조회 ──
  getMinihompyMain: (ownerId: number) =>
    api.get<ApiResponse<MinihompyMainResponse>>(`/minihompy/${ownerId}`),

  getMyMinihompy: () =>
    api.get<ApiResponse<MinihompyMainResponse>>('/minihompy/me'),


  // ── 프로필 사진 ──
  uploadProfileImage: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.put<ApiResponse<ProfileImageResponse>>('/minihompy/profile-image', form)
  },

  deleteProfileImage: () =>
    api.delete<ApiResponse<void>>('/minihompy/profile-image'),


  // ── 설정 (공개범위/소개글/기분) ──
  updateSettings: (body: MinihompySettingsRequest) =>
    api.patch<ApiResponse<MinihompyMainResponse>>('/minihompy/settings', body),


  // ── BGM ──
  getBgmOptions: () =>
    api.get<ApiResponse<BgmOptionResponse[]>>('/minihompy/bgm-options'),

  applyBgm: (itemId: number | null) =>
    api.put<ApiResponse<BgmApplyResponse>>('/minihompy/bgm', { itemId }),


  // ── 배경화면 ──
  getBackgroundDotOptions: () =>
    api.get<ApiResponse<BackgroundDotOptionResponse[]>>('/minihompy/background/dot-options'),

  applyDotBackground: (code: string) =>
    api.put<ApiResponse<BackgroundResponse>>('/minihompy/background/dot', { code }),

  uploadPhotoBackground: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.put<ApiResponse<BackgroundResponse>>('/minihompy/background/photo', form)
  },

  //  ── 방문자 조회 ──
  getRecentVisitors: () =>
  api.get<ApiResponse<VisitorLogResponse[]>>('/minihompy/visitors'),
  
}