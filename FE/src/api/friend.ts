import api from './axios'
import type { ApiResponse, FriendResponse } from '../types'

export const friendApi = {
  sendRequest: (receiverId: number) =>
    api.post<ApiResponse<void>>('/friends', { receiverId }),

  acceptRequest: (friendId: number) =>
    api.patch<ApiResponse<void>>(`/friends/${friendId}/accept`),

  rejectRequest: (friendId: number) =>
    api.patch<ApiResponse<void>>(`/friends/${friendId}/reject`),

  getFriends: () =>
    api.get<ApiResponse<FriendResponse[]>>('/friends'),

  terminate: (friendId: number) =>
    api.delete<ApiResponse<void>>(`/friends/${friendId}`),
}
