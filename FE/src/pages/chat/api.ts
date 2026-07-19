import api from '../../api/axios'
import type { ApiResponse } from '../../types'
import type {
  ChatMessagePayload,
  ChatParticipantResponse,
  ChatRoomResponse,
  ChatRoomSummary,
  ChatRoomType,
  CreateChatRoomResponse,
  Message,
} from './types'

const CHAT_PAGE_SIZE = 30

function formatChatTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
}

function getFallbackRoomName(type: ChatRoomType): string {
  return type === 'PRIVATE' ? '개인 채팅방' : '이름 없는 그룹 채팅방'
}

function mapChatRoomSummary(room: ChatRoomResponse): ChatRoomSummary {
  return {
    id: room.chatId,
    type: room.type,
    name: room.displayName ?? room.name ?? getFallbackRoomName(room.type),
    lastMsg: room.lastMessage ?? '',
    time: room.lastMessageCreatedAt ? formatChatTime(room.lastMessageCreatedAt) : '',
    unread: room.unreadCount,
  }
}

function mapMessage(message: ChatMessagePayload): Message {
  return {
    id: message.messageId,
    senderId: message.senderId,
    text: message.content,
    messageType: message.messageType,
    time: formatChatTime(message.createdAt),
    unreadMemberCount: message.unreadMemberCount,
    mediaUrls: message.mediaUrls ?? [],
  }
}

export async function getChatRooms(): Promise<ChatRoomSummary[]> {
  const response = await api.get<ApiResponse<ChatRoomResponse[]>>('/chat/rooms')
  const payload = response.data
  return payload.data.map(mapChatRoomSummary)
}

export async function getParticipants(chatId: number): Promise<ChatParticipantResponse[]> {
  const response = await api.get<ApiResponse<ChatParticipantResponse[]>>(`/chat/rooms/${chatId}/participants`)
  const payload = response.data
  return payload.data
}

export async function getMessages(chatId: number, beforeMessageId?: number): Promise<{ messages: Message[], hasMore: boolean }> {
  const response = await api.get<ApiResponse<ChatMessagePayload[]>>(`/chat/rooms/${chatId}/messages`, {
    params: beforeMessageId !== undefined ? { beforeMessageId } : undefined,
  })
  const payload = response.data

  return {
    messages: payload.data.map(mapMessage),
    hasMore: payload.data.length === CHAT_PAGE_SIZE,
  }
}

export async function markChatRoomAsRead(chatId: number): Promise<void> {
  await api.patch(`/chat/rooms/${chatId}/read`)
}

export async function deleteChatMessage(chatId: number, messageId: number): Promise<void> {
  await api.patch(`/chat/rooms/${chatId}/messages/${messageId}/delete`)
}

export async function leaveChatRoom(chatId: number): Promise<void> {
  await api.patch(`/chat/rooms/${chatId}/leave`)
}

export async function inviteParticipant(chatId: number, participantUserId: number): Promise<void> {
  try {
    await api.post('/chat/rooms/' + chatId + '/participants', {
      participantUserIds: [participantUserId],
    })
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '참여자 초대에 실패했습니다.')
  }
}

export async function createChatRoom(type: ChatRoomType, name: string, participantUserIds: number[]): Promise<CreateChatRoomResponse> {
  const response = await api.post<ApiResponse<CreateChatRoomResponse>>('/chat/rooms', {
    type,
    name,
    participantUserIds,
  })
  const payload = response.data
  return payload.data
}

export async function uploadChatMedia(files: File[]): Promise<string[]> {
  const formData = new FormData()
  files.forEach((file) => formData.append('files', file))

  const response = await api.post<ApiResponse<string[]>>('/chat/media/upload', formData)
  const payload = response.data
  return payload.data
}
