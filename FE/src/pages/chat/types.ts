export type ChatRoomType = 'PRIVATE' | 'GROUP'
export type ChatMessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM'
export type ChatEventType = 'MESSAGE' | 'READ_SYNC'
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected'

export interface ChatRoomSummary {
  id: number
  type: ChatRoomType
  name: string
  lastMsg: string
  time: string
  unread?: number
}

export interface ChatRoomResponse {
  chatId: number
  type: ChatRoomType
  name: string | null
  displayName: string | null
  lastMessage: string | null
  lastMessageCreatedAt: string | null
  unreadCount: number
}

export interface ChatMessagePayload {
  eventType: ChatEventType
  messageId: number
  chatId: number
  senderId: number
  content: string
  messageType: ChatMessageType
  createdAt: string
  unreadMemberCount: number
  mediaUrls: string[]
}

export interface ChatListUpdatePayload {
  userId: number
  chatId: number
  type: ChatRoomType
  displayName: string | null
  lastMessage: string | null
  lastMessageCreatedAt: string | null
  unreadCount: number
}

export interface ChatParticipantResponse {
  userId: number
  nickname: string
}

export interface Message {
  id: number
  senderId: number
  text: string
  messageType: ChatMessageType
  time: string
  unreadMemberCount: number
  mediaUrls: string[]
}

export interface PendingAttachment {
  id: string
  file: File
  previewUrl: string
  isImage: boolean
}

export interface FriendCandidate {
  userId: number
  nickname: string
}

export interface CreateChatRoomResponse {
  chatId: number
  type: ChatRoomType
  name: string | null
  displayName: string | null
}
