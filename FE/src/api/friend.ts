import api from './axios'
import type { ApiResponse, FriendResponse, FriendSendResponse, UserSearchResponse } from '../types'

export const friendApi = {
  sendRequest: (receiverId: number, requesterAlias?: string, receiverAlias?: string) =>
    api.post<ApiResponse<FriendSendResponse>>('/friends', { receiverId, requesterAlias, receiverAlias }),

  acceptRequest: (friendId: number) =>
    api.patch<ApiResponse<void>>(`/friends/${friendId}/accept`),

  rejectRequest: (friendId: number) =>
    api.patch<ApiResponse<void>>(`/friends/${friendId}/reject`),

  getFriends: () =>
    api.get<ApiResponse<FriendResponse[]>>('/friends'),

  getPendingRequests: () =>
    api.get<ApiResponse<FriendResponse[]>>('/friends/pending'),

  setAlias: (friendId: number, alias: string) =>
    api.patch<ApiResponse<void>>(`/friends/${friendId}/alias`, { alias }),

  terminate: (friendId: number) =>
    api.delete<ApiResponse<void>>(`/friends/${friendId}`),

  searchUsers: (nickname: string) =>
    api.get<ApiResponse<UserSearchResponse[]>>('/users/search', { params: { nickname } }),
}
