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

export async function getChatRooms(userId: number): Promise<ChatRoomSummary[]> {
  const response = await fetch('/api/chat/rooms', {
    headers: {
      'X-User-Id': String(userId),
    },
  })

  if (!response.ok) {
    throw new Error('채팅방 목록 조회에 실패했습니다.')
  }

  const payload = await response.json() as ApiResponse<ChatRoomResponse[]>
  return payload.data.map(mapChatRoomSummary)
}

export async function getParticipants(userId: number, chatId: number): Promise<ChatParticipantResponse[]> {
  const response = await fetch(`/api/chat/rooms/${chatId}/participants`, {
    headers: {
      'X-User-Id': String(userId),
    },
  })

  if (!response.ok) {
    throw new Error('참여자 목록 조회에 실패했습니다.')
  }

  const payload = await response.json() as ApiResponse<ChatParticipantResponse[]>
  return payload.data
}

export async function getMessages(userId: number, chatId: number, beforeMessageId?: number): Promise<{ messages: Message[], hasMore: boolean }> {
  const queryString = beforeMessageId !== undefined ? `?beforeMessageId=${beforeMessageId}` : ''
  const response = await fetch(`/api/chat/rooms/${chatId}/messages${queryString}`, {
    headers: {
      'X-User-Id': String(userId),
    },
  })

  if (!response.ok) {
    throw new Error('메시지 목록 조회에 실패했습니다.')
  }

  const payload = await response.json() as ApiResponse<ChatMessagePayload[]>

  return {
    messages: payload.data.map(mapMessage),
    hasMore: payload.data.length === CHAT_PAGE_SIZE,
  }
}

export async function markChatRoomAsRead(userId: number, chatId: number): Promise<void> {
  const response = await fetch(`/api/chat/rooms/${chatId}/read`, {
    method: 'PATCH',
    headers: {
      'X-User-Id': String(userId),
    },
  })

  if (!response.ok) {
    throw new Error('읽음 처리에 실패했습니다.')
  }
}

export async function deleteChatMessage(userId: number, chatId: number, messageId: number): Promise<void> {
  const response = await fetch(`/api/chat/rooms/${chatId}/messages/${messageId}/delete`, {
    method: 'PATCH',
    headers: {
      'X-User-Id': String(userId),
    },
  })

  if (!response.ok) {
    throw new Error('메시지 삭제에 실패했습니다.')
  }
}

export async function leaveChatRoom(userId: number, chatId: number): Promise<void> {
  const response = await fetch(`/api/chat/rooms/${chatId}/leave`, {
    method: 'PATCH',
    headers: {
      'X-User-Id': String(userId),
    },
  })

  if (!response.ok) {
    throw new Error('채팅방 나가기에 실패했습니다.')
  }
}

export async function inviteParticipant(userId: number, chatId: number, participantUserId: number): Promise<void> {
  const response = await fetch(`/api/chat/rooms/${chatId}/participants`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': String(userId),
    },
    body: JSON.stringify({
      participantUserIds: [participantUserId],
    }),
  })

  if (!response.ok) {
    const errorPayload = await response.json() as ApiResponse<null>
    throw new Error(errorPayload.message || '참여자 초대에 실패했습니다.')
  }
}

export async function createChatRoom(userId: number, type: ChatRoomType, name: string, participantUserIds: number[]): Promise<CreateChatRoomResponse> {
  const response = await fetch('/api/chat/rooms', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': String(userId),
    },
    body: JSON.stringify({
      type,
      name,
      participantUserIds,
    }),
  })

  if (!response.ok) {
    throw new Error('채팅방 생성에 실패했습니다.')
  }

  const payload = await response.json() as ApiResponse<CreateChatRoomResponse>
  return payload.data
}

export async function uploadChatMedia(files: File[]): Promise<string[]> {
  const formData = new FormData()
  files.forEach((file) => formData.append('files', file))

  const response = await fetch('/api/chat/media/upload', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('첨부 업로드에 실패했습니다.')
  }

  const payload = await response.json() as ApiResponse<string[]>
  return payload.data
}
