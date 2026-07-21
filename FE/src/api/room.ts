import api from './axios'
import type { ApiResponse, RoomResponse, SaveRoomRequest } from '../types'

export const roomApi = {
  getRoom: (userId: number) =>
    api.get<ApiResponse<RoomResponse>>(`/rooms/${userId}`),

  getMyRoom: () =>
    api.get<ApiResponse<RoomResponse>>('/rooms/me'),

  saveMyRoom: (body: SaveRoomRequest) =>
    api.put<ApiResponse<RoomResponse>>('/rooms/me', body),
}
