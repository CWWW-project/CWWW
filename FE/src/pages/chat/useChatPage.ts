import { useEffect, useMemo, useRef, useState } from 'react'

import { friendApi } from '../../api/friend'
import { buildFrame, getWebSocketUrl, parseFrames } from '../../lib/websocket'
import { useAuthStore } from '../../store/authStore'
import {
  createChatRoom,
  deleteChatMessage,
  getChatRooms,
  getMessages,
  getParticipants,
  inviteParticipant,
  leaveChatRoom,
  markChatRoomAsRead,
  uploadChatMedia,
} from './api'
import type {
  ChatListUpdatePayload,
  ChatMessagePayload,
  FriendCandidate,
  ChatParticipantResponse,
  ChatRoomSummary,
  ChatRoomType,
  ConnectionStatus,
  Message,
  PendingAttachment,
} from './types'

function formatChatTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
}

function getFallbackRoomName(type: ChatRoomType): string {
  return type === 'PRIVATE' ? '개인 채팅방' : '이름 없는 그룹 채팅방'
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

function createAttachmentId(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`
}

export function useChatPage() {
  const { user, accessToken } = useAuthStore()
  const currentUserId = user?.id ?? Number(localStorage.getItem('userId') ?? 0)

  const [activeId, setActiveId] = useState<number | null>(null)
  const [chatRooms, setChatRooms] = useState<ChatRoomSummary[]>([])
  const [messagesByRoom, setMessagesByRoom] = useState<Record<number, Message[]>>({})
  const [participantsByRoom, setParticipantsByRoom] = useState<Record<number, ChatParticipantResponse[]>>({})
  const [hasMoreByRoom, setHasMoreByRoom] = useState<Record<number, boolean>>({})
  const [friendCandidates, setFriendCandidates] = useState<FriendCandidate[]>([])
  const [input, setInput] = useState('')
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting')
  const [isReady, setIsReady] = useState(false)
  const [isInitialRoomsLoaded, setIsInitialRoomsLoaded] = useState(false)
  const [isSocketReady, setIsSocketReady] = useState(false)
  const [createType, setCreateType] = useState<ChatRoomType>('PRIVATE')
  const [createName, setCreateName] = useState('')
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<number[]>([])
  const [createError, setCreateError] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [loadingMoreRoomId, setLoadingMoreRoomId] = useState<number | null>(null)
  const [isRoomViewportSettling, setIsRoomViewportSettling] = useState(false)
  const [openMessageMenuId, setOpenMessageMenuId] = useState<number | null>(null)
  const [inviteUserId, setInviteUserId] = useState<number | null>(null)
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([])
  const messageContainerRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef<WebSocket | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const subscriptionIdRef = useRef<string | null>(null)
  const pendingScrollActionRef = useRef<'bottom' | 'preserve' | null>(null)
  const previousScrollHeightRef = useRef(0)
  const previousScrollTopRef = useRef(0)
  const attachmentCleanupRef = useRef<PendingAttachment[]>([])

  const activeRoom = useMemo(
    () => chatRooms.find((room) => room.id === activeId) ?? null,
    [activeId, chatRooms],
  )
  const messages = activeId !== null ? messagesByRoom[activeId] ?? [] : []
  const activeParticipants = activeId !== null ? participantsByRoom[activeId] ?? [] : []
  const isSocketConnected = connectionStatus === 'connected'

  useEffect(() => {
    attachmentCleanupRef.current = pendingAttachments
  }, [pendingAttachments])

  const refreshChatRooms = async () => {
    const rooms = await getChatRooms()
    setChatRooms(rooms)
  }

  const refreshParticipants = async (chatId: number) => {
    const participants = await getParticipants(chatId)
    setParticipantsByRoom((prev) => ({
      ...prev,
      [chatId]: participants,
    }))
  }

  const refreshMessages = async (chatId: number, beforeMessageId?: number) => {
    const { messages: fetchedMessages, hasMore } = await getMessages(chatId, beforeMessageId)

    if (beforeMessageId === undefined) {
      pendingScrollActionRef.current = 'bottom'
    }

    setMessagesByRoom((prev) => {
      if (beforeMessageId === undefined) {
        return {
          ...prev,
          [chatId]: fetchedMessages,
        }
      }

      const currentMessages = prev[chatId] ?? []
      return {
        ...prev,
        [chatId]: [...fetchedMessages, ...currentMessages],
      }
    })

    setHasMoreByRoom((prev) => ({
      ...prev,
      [chatId]: hasMore,
    }))
  }

  const syncDeletedMessageInState = (chatId: number, messageId: number) => {
    setMessagesByRoom((prev) => {
      const currentMessages = prev[chatId] ?? []
      return {
        ...prev,
        [chatId]: currentMessages.filter((message) => message.id !== messageId),
      }
    })
  }

  useEffect(() => {
    const container = messageContainerRef.current
    if (!container) return

    if (pendingScrollActionRef.current === 'preserve') {
      const scrollHeightDiff = container.scrollHeight - previousScrollHeightRef.current
      container.scrollTop = previousScrollTopRef.current + scrollHeightDiff
      pendingScrollActionRef.current = null
      return
    }

    if (pendingScrollActionRef.current === 'bottom') {
      bottomRef.current?.scrollIntoView({ behavior: 'auto' })
      pendingScrollActionRef.current = null

      if (isRoomViewportSettling) {
        window.requestAnimationFrame(() => {
          setIsRoomViewportSettling(false)
        })
      }
    }
  }, [isRoomViewportSettling, messages])

  useEffect(() => {
    setIsReady(false)
    setIsInitialRoomsLoaded(false)
    setIsSocketReady(false)
    setSelectedParticipantIds([])
  }, [currentUserId])

  useEffect(() => () => {
    attachmentCleanupRef.current.forEach((attachment) => URL.revokeObjectURL(attachment.previewUrl))
  }, [])

  useEffect(() => {
    if (!accessToken || !currentUserId) {
      setIsInitialRoomsLoaded(true)
      return
    }

    refreshChatRooms()
      .catch(() => {
        setCreateError('채팅방 목록 조회에 실패했습니다.')
      })
      .finally(() => {
        setIsInitialRoomsLoaded(true)
      })
  }, [accessToken, currentUserId])

  useEffect(() => {
    if (!accessToken || !currentUserId) {
      setFriendCandidates([])
      setInviteUserId(null)
      return
    }

    friendApi.getFriends()
      .then((response) => {
        const candidates = response.data.data.map((friend) => ({
          userId: friend.requesterId === currentUserId ? friend.receiverId : friend.requesterId,
          nickname: friend.opponentNickname,
        }))
        setFriendCandidates(candidates)
        setInviteUserId(candidates[0]?.userId ?? null)
      })
      .catch(() => {
        setFriendCandidates([])
        setInviteUserId(null)
      })
  }, [accessToken, currentUserId])

  useEffect(() => {
    setActiveId((prev) => {
      if (prev === null) return null
      return chatRooms.some((room) => room.id === prev) ? prev : null
    })
  }, [chatRooms])

  const handleSelectRoom = async (chatId: number) => {
    setIsRoomViewportSettling(true)
    setActiveId(chatId)

    try {
      await refreshMessages(chatId)
      await refreshParticipants(chatId)
      await markChatRoomAsRead(chatId)
    } catch {
      setCreateError('메시지 목록 조회 또는 읽음 처리에 실패했습니다.')
      setIsRoomViewportSettling(false)
    }
  }

  const loadOlderMessages = async (chatId: number) => {
    const currentMessages = messagesByRoom[chatId] ?? []
    const container = messageContainerRef.current

    if (currentMessages.length === 0 || !container) {
      return
    }

    previousScrollHeightRef.current = container.scrollHeight
    previousScrollTopRef.current = container.scrollTop
    pendingScrollActionRef.current = 'preserve'
    setLoadingMoreRoomId(chatId)

    try {
      await refreshMessages(chatId, currentMessages[0].id)
    } catch {
      setCreateError('이전 메시지 조회에 실패했습니다.')
    } finally {
      setLoadingMoreRoomId(null)
    }
  }

  useEffect(() => {
    if (!accessToken || !currentUserId) {
      setConnectionStatus('disconnected')
      setIsSocketReady(false)
      return
    }

    const socket = new WebSocket(getWebSocketUrl())
    socketRef.current = socket

    socket.onopen = () => {
      setConnectionStatus('connecting')
      socket.send(buildFrame('CONNECT', {
        'accept-version': '1.2',
        host: 'localhost',
        Authorization: `Bearer ${accessToken}`,
      }))
    }

    socket.onmessage = (event) => {
      const frames = parseFrames(String(event.data))

      frames.forEach((frame) => {
        if (frame.command === 'CONNECTED') {
          setConnectionStatus('connected')
          setIsSocketReady(true)
          socket.send(buildFrame('SUBSCRIBE', {
            id: `sub-list-${currentUserId}`,
            destination: `/sub/chat/list/${currentUserId}`,
          }))
          if (activeId !== null) {
            const subscriptionId = `sub-room-${activeId}`
            subscriptionIdRef.current = subscriptionId
            socket.send(buildFrame('SUBSCRIBE', {
              id: subscriptionId,
              destination: `/sub/chat/room/${activeId}`,
            }))
          }
          return
        }

        if (frame.command !== 'MESSAGE') return

        if (frame.headers.destination === `/sub/chat/list/${currentUserId}`) {
          const payload = JSON.parse(frame.body) as ChatListUpdatePayload

          setChatRooms((prev) => {
            const previousRoom = prev.find((room) => room.id === payload.chatId)
            const nextRoom: ChatRoomSummary = {
              id: payload.chatId,
              type: payload.type,
              name: payload.displayName ?? getFallbackRoomName(payload.type),
              lastMsg: payload.lastMessage ?? '',
              time: payload.lastMessageCreatedAt ? formatChatTime(payload.lastMessageCreatedAt) : '',
              unread: payload.unreadCount,
            }

            if (!previousRoom) {
              return [nextRoom, ...prev]
            }

            const sameLastMessage = previousRoom.lastMsg === nextRoom.lastMsg
            const sameTime = previousRoom.time === nextRoom.time

            if (sameLastMessage && sameTime) {
              return prev.map((room) => (room.id === payload.chatId ? nextRoom : room))
            }

            const nextRooms = prev.filter((room) => room.id !== payload.chatId)
            nextRooms.unshift(nextRoom)
            return nextRooms
          })
          return
        }

        const payload = JSON.parse(frame.body) as ChatMessagePayload
        const nextMessage = mapMessage(payload)

        if (payload.eventType === 'MESSAGE' && payload.chatId === activeId) {
          pendingScrollActionRef.current = 'bottom'
        }

        setMessagesByRoom((prev) => {
          const currentMessages = prev[payload.chatId] ?? []
          const nextMessages = [...currentMessages]
          const existingIndex = nextMessages.findIndex((message) => message.id === nextMessage.id)

          if (existingIndex >= 0) {
            nextMessages[existingIndex] = nextMessage
          } else {
            nextMessages.push(nextMessage)
          }

          return {
            ...prev,
            [payload.chatId]: nextMessages,
          }
        })

        if (payload.chatId === activeId && payload.senderId !== currentUserId && payload.eventType === 'MESSAGE') {
          markChatRoomAsRead(payload.chatId).catch(() => {
            setCreateError('읽음 처리에 실패했습니다.')
          })
        }

        if (payload.eventType === 'MESSAGE') {
          setChatRooms((prev) => prev.map((room) => {
            if (room.id !== payload.chatId) return room
            return {
              ...room,
              lastMsg: payload.content,
              time: formatChatTime(payload.createdAt),
              unread: payload.chatId === activeId || payload.senderId === currentUserId ? 0 : (room.unread ?? 0) + 1,
            }
          }))
        }
      })
    }

    socket.onerror = () => {
      setConnectionStatus('disconnected')
      setIsSocketReady(false)
    }

    socket.onclose = () => {
      setConnectionStatus('disconnected')
      setIsSocketReady(false)
    }

    return () => {
      if (socket.readyState === WebSocket.OPEN && subscriptionIdRef.current) {
        socket.send(buildFrame('UNSUBSCRIBE', { id: subscriptionIdRef.current }))
      }
      socket.close()
    }
  }, [accessToken, activeId, currentUserId])

  useEffect(() => {
    if (isInitialRoomsLoaded && isSocketReady) {
      setIsReady(true)
    }
  }, [isInitialRoomsLoaded, isSocketReady])

  const handleCreateChatRoom = async () => {
    if (!currentUserId) {
      setCreateError('로그인 정보가 없습니다.')
      return
    }

    const participantUserIds = [...new Set([currentUserId, ...selectedParticipantIds])]

    if (participantUserIds.length < 2) {
      setCreateError('참여자를 최소 1명 이상 선택하세요.')
      return
    }

    setCreateError('')
    setCreateLoading(true)

    try {
      const createdRoom = await createChatRoom(createType, createName, participantUserIds)
      setMessagesByRoom((prev) => ({ ...prev, [createdRoom.chatId]: [] }))
      await refreshChatRooms()
      await handleSelectRoom(createdRoom.chatId)
      setCreateName('')
      setSelectedParticipantIds([])
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : '채팅방 생성에 실패했습니다.')
    } finally {
      setCreateLoading(false)
    }
  }

  const handleOpenFilePicker = () => {
    fileInputRef.current?.click()
  }

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) {
      return
    }

    const nextAttachments = Array.from(files).map((file) => ({
      id: createAttachmentId(file),
      file,
      previewUrl: URL.createObjectURL(file),
      isImage: file.type.startsWith('image/'),
    }))

    setPendingAttachments((prev) => [...prev, ...nextAttachments])
    textareaRef.current?.focus()
  }

  const removePendingAttachment = (attachmentId: string) => {
    setPendingAttachments((prev) => {
      const target = prev.find((attachment) => attachment.id === attachmentId)
      if (target) {
        URL.revokeObjectURL(target.previewUrl)
      }
      return prev.filter((attachment) => attachment.id !== attachmentId)
    })
  }

  const sendMessage = async () => {
    const trimmedInput = input.trim()
    const hasAttachments = pendingAttachments.length > 0

    if (!trimmedInput && !hasAttachments) return
    if (activeId === null) return
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return

    try {
      const mediaUrls = hasAttachments
        ? await uploadChatMedia(pendingAttachments.map((attachment) => attachment.file))
        : []
      const hasOnlyImages = hasAttachments && pendingAttachments.every((attachment) => attachment.isImage)
      const messageType = hasAttachments ? (hasOnlyImages ? 'IMAGE' : 'FILE') : 'TEXT'

      socketRef.current.send(buildFrame('SEND', {
        destination: '/pub/chat/message',
        'content-type': 'application/json',
      }, JSON.stringify({
        chatId: activeId,
        content: trimmedInput,
        messageType,
        mediaUrls,
      })))

      pendingAttachments.forEach((attachment) => URL.revokeObjectURL(attachment.previewUrl))
      setPendingAttachments([])
      setInput('')
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : '메시지 전송에 실패했습니다.')
    }
  }

  const handleDeleteMessage = async (messageId: number) => {
    if (activeId === null) return

    setOpenMessageMenuId(null)

    try {
      await deleteChatMessage(activeId, messageId)
      syncDeletedMessageInState(activeId, messageId)
      await markChatRoomAsRead(activeId)
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : '메시지 삭제에 실패했습니다.')
    }
  }

  const handleLeaveRoom = async () => {
    if (activeId === null) return

    try {
      await leaveChatRoom(activeId)
      setActiveId(null)
      await refreshChatRooms()
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : '채팅방 나가기에 실패했습니다.')
    }
  }

  const handleInviteParticipant = async () => {
    if (activeId === null || inviteUserId === null) return

    try {
      await inviteParticipant(activeId, inviteUserId)
      await refreshParticipants(activeId)
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : '참여자 초대에 실패했습니다.')
    }
  }

  return {
    activeId,
    activeParticipants,
    activeRoom,
    bottomRef,
    chatRooms,
    connectionStatus,
    createError,
    createLoading,
    createName,
    createType,
    fileInputRef,
    handleCreateChatRoom,
    handleDeleteMessage,
    handleFilesSelected,
    handleInviteParticipant,
    handleLeaveRoom,
    handleOpenFilePicker,
    handleSelectRoom,
    hasMoreByRoom,
    input,
    inviteUserId,
    isReady,
    isRoomViewportSettling,
    isSocketConnected,
    loadingMoreRoomId,
    loadOlderMessages,
    messageContainerRef,
    messages,
    openMessageMenuId,
    pendingAttachments,
    removePendingAttachment,
    selectedParticipantIds,
    currentUser: user,
    currentUserId,
    friendCandidates,
    sendMessage,
    setCreateName,
    setCreateType,
    setInput,
    setInviteUserId,
    setOpenMessageMenuId,
    setSelectedParticipantIds,
    textareaRef,
  }
}
