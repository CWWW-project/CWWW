import { useEffect, useMemo, useRef, useState } from 'react'

interface ChatRoomSummary {
  id: number
  type: 'PRIVATE' | 'GROUP'
  name: string
  lastMsg: string
  time: string
  online: boolean
  unread?: number
}

interface ChatRoomResponse {
  chatId: number
  type: 'PRIVATE' | 'GROUP'
  name: string | null
  displayName: string | null
  lastMessage: string | null
  lastMessageCreatedAt: string | null
  unreadCount: number
}

interface ApiResponse<T> {
  code: string
  message: string
  data: T
}

interface ChatMessagePayload {
  eventType: 'MESSAGE' | 'READ_SYNC'
  messageId: number
  chatId: number
  senderId: number
  content: string
  messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM'
  createdAt: string
  unreadMemberCount: number
}

interface ChatListUpdatePayload {
  userId: number
  chatId: number
  type: 'PRIVATE' | 'GROUP'
  displayName: string | null
  lastMessage: string | null
  lastMessageCreatedAt: string | null
  unreadCount: number
}

interface Message {
  id: number
  senderId: number
  text: string
  messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM'
  time: string
  unreadMemberCount: number
}

interface CreateChatRoomResponse {
  chatId: number
  type: 'PRIVATE' | 'GROUP'
  name: string | null
  displayName: string | null
}

interface TestUser {
  id: number
  nickname: string
}

const testUsers: TestUser[] = [
  { id: 1, nickname: '김찬호' },
  { id: 2, nickname: '윤주원' },
  { id: 3, nickname: '김채린' },
  { id: 4, nickname: '장수호' },
  { id: 5, nickname: '정용혁' },
]

function formatChatTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
}

function getWebSocketUrl(): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//localhost:8080/ws`
}

function buildFrame(command: string, headers: Record<string, string>, body = ''): string {
  const headerLines = Object.entries(headers).map(([key, value]) => `${key}:${value}`)
  return `${command}\n${headerLines.join('\n')}\n\n${body}\0`
}

function parseFrames(raw: string): Array<{ command: string, headers: Record<string, string>, body: string }> {
  return raw
    .split('\0')
    .map(frame => frame.trim())
    .filter(Boolean)
    .map(frame => {
      const [headerPart, ...bodyParts] = frame.split('\n\n')
      const [command, ...headerLines] = headerPart.split('\n')
      const headers = headerLines.reduce<Record<string, string>>((acc, line) => {
        const separatorIndex = line.indexOf(':')
        if (separatorIndex === -1) return acc
        const key = line.slice(0, separatorIndex)
        const value = line.slice(separatorIndex + 1)
        acc[key] = value
        return acc
      }, {})

      return {
        command,
        headers,
        body: bodyParts.join('\n\n'),
      }
    })
}

export default function ChatPage() {
  const initialUserId = Number(localStorage.getItem('userId') ?? 1)

  const [activeId, setActiveId] = useState<number | null>(null)
  const [chatRooms, setChatRooms] = useState<ChatRoomSummary[]>([])
  const [messagesByRoom, setMessagesByRoom] = useState<Record<number, Message[]>>({})
  const [hasMoreByRoom, setHasMoreByRoom] = useState<Record<number, boolean>>({})
  const [input, setInput] = useState('')
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const [selectedUserId, setSelectedUserId] = useState(initialUserId)
  const [createType, setCreateType] = useState<'PRIVATE' | 'GROUP'>('PRIVATE')
  const [createName, setCreateName] = useState('')
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<number[]>([initialUserId])
  const [createError, setCreateError] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [loadingMoreRoomId, setLoadingMoreRoomId] = useState<number | null>(null)
  const [openMessageMenuId, setOpenMessageMenuId] = useState<number | null>(null)
  const [inviteUserId, setInviteUserId] = useState<number>(2)
  const messageContainerRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef<WebSocket | null>(null)
  const subscriptionIdRef = useRef<string | null>(null)
  const pendingScrollActionRef = useRef<'bottom' | 'preserve' | null>(null)
  const previousScrollHeightRef = useRef(0)
  const previousScrollTopRef = useRef(0)

  const activeRoom = useMemo(
    () => chatRooms.find(room => room.id === activeId) ?? null,
    [activeId, chatRooms],
  )
  const messages = activeId !== null ? messagesByRoom[activeId] ?? [] : []
  const selectedUser = useMemo(
    () => testUsers.find(user => user.id === selectedUserId) ?? testUsers[0],
    [selectedUserId],
  )

  const getUserNickname = (userId: number) => {
    const matchedUser = testUsers.find((user) => user.id === userId)

    if (!matchedUser) {
      return `유저 ${userId}`
    }

    return matchedUser.nickname
  }

  const fetchChatRooms = async (userId: number) => {
    const response = await fetch('/api/chat/rooms', {
      headers: {
        'X-User-Id': String(userId),
      },
    })

    if (!response.ok) {
      throw new Error('채팅방 목록 조회에 실패했습니다.')
    }

    const payload = await response.json() as ApiResponse<ChatRoomResponse[]>

    setChatRooms((prev) => payload.data.map((room) => {
      const previousRoom = prev.find(item => item.id === room.chatId)

      return {
        id: room.chatId,
        type: room.type,
        name: room.displayName ?? room.name ?? (room.type === 'PRIVATE' ? '개인 채팅방' : '이름 없는 그룹 채팅방'),
        lastMsg: room.lastMessage ?? '',
        time: room.lastMessageCreatedAt ? formatChatTime(room.lastMessageCreatedAt) : '',
        online: previousRoom?.online ?? false,
        unread: room.unreadCount,
      }
    }))
  }

  const fetchMessages = async (userId: number, chatId: number, beforeMessageId?: number) => {
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
    console.log('message history payload', payload)

    if (beforeMessageId === undefined) {
      pendingScrollActionRef.current = 'bottom'
    }

    const fetchedMessages = payload.data.map((message) => ({
        id: message.messageId,
        senderId: message.senderId,
        text: message.content,
        messageType: message.messageType,
        time: formatChatTime(message.createdAt),
        unreadMemberCount: message.unreadMemberCount,
      }))

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
      [chatId]: payload.data.length === 30,
    }))
  }

  const markChatRoomAsRead = async (userId: number, chatId: number) => {
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

  const deleteMessage = async (chatId: number, messageId: number) => {
    const response = await fetch(`/api/chat/rooms/${chatId}/messages/${messageId}/delete`, {
      method: 'PATCH',
      headers: {
        'X-User-Id': String(selectedUserId),
      },
    })

    if (!response.ok) {
      throw new Error('메시지 삭제에 실패했습니다.')
    }
  }

  const syncDeletedMessageInState = (chatId: number, messageId: number) => {
    setMessagesByRoom((prev) => {
      const currentMessages = prev[chatId] ?? []
      const nextMessages = currentMessages.filter((message) => message.id !== messageId)

      return {
        ...prev,
        [chatId]: nextMessages,
      }
    })
  }

  const leaveChatRoom = async (chatId: number) => {
    const response = await fetch(`/api/chat/rooms/${chatId}/leave`, {
      method: 'PATCH',
      headers: {
        'X-User-Id': String(selectedUserId),
      },
    })

    if (!response.ok) {
      throw new Error('채팅방 나가기에 실패했습니다.')
    }
  }

  const inviteParticipant = async (chatId: number, participantUserId: number) => {
    const response = await fetch(`/api/chat/rooms/${chatId}/participants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': String(selectedUserId),
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

  useEffect(() => {
    const container = messageContainerRef.current

    if (!container) {
      return
    }

    if (pendingScrollActionRef.current === 'preserve') {
      const scrollHeightDiff = container.scrollHeight - previousScrollHeightRef.current
      container.scrollTop = previousScrollTopRef.current + scrollHeightDiff
      pendingScrollActionRef.current = null
      return
    }

    if (pendingScrollActionRef.current === 'bottom') {
      bottomRef.current?.scrollIntoView({ behavior: 'auto' })
      pendingScrollActionRef.current = null
    }
  }, [messages])

  useEffect(() => {
    localStorage.setItem('userId', String(selectedUserId))
    setSelectedParticipantIds((prev) => {
      const withoutSelectedUser = prev.filter(id => id !== selectedUserId)
      return [selectedUserId, ...withoutSelectedUser]
    })
  }, [selectedUserId])

  useEffect(() => {
    if (inviteUserId === selectedUserId) {
      const candidate = testUsers.find((user) => user.id !== selectedUserId)
      if (candidate) {
        setInviteUserId(candidate.id)
      }
    }
  }, [inviteUserId, selectedUserId])

  useEffect(() => {
    fetchChatRooms(selectedUserId)
      .catch(() => {
        setCreateError('채팅방 목록 조회에 실패했습니다.')
      })
  }, [selectedUserId])

  useEffect(() => {
    setActiveId((prev) => {
      if (prev === null) return null
      return chatRooms.some(room => room.id === prev) ? prev : null
    })
  }, [chatRooms])

  const handleSelectRoom = async (chatId: number) => {
    setActiveId(chatId)

    try {
      await fetchMessages(selectedUserId, chatId)
      await markChatRoomAsRead(selectedUserId, chatId)
    } catch (error) {
      setCreateError('메시지 목록 조회 또는 읽음 처리에 실패했습니다.')
    }
  }

  const loadOlderMessages = async (chatId: number) => {
    const currentMessages = messagesByRoom[chatId] ?? []
    const container = messageContainerRef.current

    if (currentMessages.length === 0) {
      return
    }

    if (!container) {
      return
    }

    previousScrollHeightRef.current = container.scrollHeight
    previousScrollTopRef.current = container.scrollTop
    pendingScrollActionRef.current = 'preserve'

    setLoadingMoreRoomId(chatId)

    try {
      await fetchMessages(selectedUserId, chatId, currentMessages[0].id)
    } catch (error) {
      setCreateError('이전 메시지 조회에 실패했습니다.')
    } finally {
      setLoadingMoreRoomId(null)
    }
  }

  useEffect(() => {
    const socket = new WebSocket(getWebSocketUrl())
    socketRef.current = socket

    socket.onopen = () => {
      setConnectionStatus('connecting')
      socket.send(buildFrame('CONNECT', {
        'accept-version': '1.2',
        host: 'localhost',
      }))
    }

    socket.onmessage = (event) => {
      const frames = parseFrames(String(event.data))

      frames.forEach((frame) => {
        if (frame.command === 'CONNECTED') {
          setConnectionStatus('connected')
          socket.send(buildFrame('SUBSCRIBE', {
            id: `sub-list-${selectedUserId}`,
            destination: `/sub/chat/list/${selectedUserId}`,
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

        if (frame.headers.destination === `/sub/chat/list/${selectedUserId}`) {
          const payload = JSON.parse(frame.body) as ChatListUpdatePayload

          setChatRooms((prev) => {
            const previousRoom = prev.find((room) => room.id === payload.chatId)
            const nextRoom: ChatRoomSummary = {
              id: payload.chatId,
              type: payload.type,
              name: payload.displayName ?? (payload.type === 'PRIVATE' ? '개인 채팅방' : '이름 없는 그룹 채팅방'),
              lastMsg: payload.lastMessage ?? '',
              time: payload.lastMessageCreatedAt ? formatChatTime(payload.lastMessageCreatedAt) : '',
              online: previousRoom?.online ?? false,
              unread: payload.unreadCount,
            }

            if (!previousRoom) {
              const nextRooms = [...prev]
              nextRooms.unshift(nextRoom)
              return nextRooms
            }

            const sameLastMessage = previousRoom.lastMsg === nextRoom.lastMsg
            const sameTime = previousRoom.time === nextRoom.time

            if (sameLastMessage && sameTime) {
              return prev.map((room) => {
                if (room.id !== payload.chatId) {
                  return room
                }
                return nextRoom
              })
            }

            const nextRooms = prev.filter((room) => room.id !== payload.chatId)
            nextRooms.unshift(nextRoom)
            return nextRooms
          })
          return
        }

        const payload = JSON.parse(frame.body) as ChatMessagePayload
        console.log('chat message payload', payload)
        const nextMessage: Message = {
          id: payload.messageId,
          senderId: payload.senderId,
          text: payload.content,
          messageType: payload.messageType,
          time: formatChatTime(payload.createdAt),
          unreadMemberCount: payload.unreadMemberCount,
        }

        if (payload.eventType === 'MESSAGE' && payload.chatId === activeId) {
          pendingScrollActionRef.current = 'bottom'
        }

        setMessagesByRoom((prev) => {
          const currentMessages = prev[payload.chatId] ?? []
          const nextMessages = [...currentMessages]
          const existingIndex = nextMessages.findIndex(message => message.id === nextMessage.id)

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

        if (payload.chatId === activeId && payload.senderId !== selectedUserId) {
          if (payload.eventType === 'MESSAGE') {
          markChatRoomAsRead(selectedUserId, payload.chatId).catch(() => {
            setCreateError('읽음 처리에 실패했습니다.')
          })
          }
        }

        if (payload.eventType === 'MESSAGE') {
          setChatRooms((prev) => prev.map((room) => {
            if (room.id !== payload.chatId) return room
            return {
              ...room,
              lastMsg: payload.content,
              time: formatChatTime(payload.createdAt),
              unread: payload.chatId === activeId || payload.senderId === selectedUserId ? 0 : (room.unread ?? 0) + 1,
            }
          }))
        }
      })
    }

    socket.onerror = () => {
      setConnectionStatus('disconnected')
    }

    socket.onclose = () => {
      setConnectionStatus('disconnected')
    }

    return () => {
      if (socket.readyState === WebSocket.OPEN && subscriptionIdRef.current) {
        socket.send(buildFrame('UNSUBSCRIBE', { id: subscriptionIdRef.current }))
      }
      socket.close()
    }
  }, [activeId, selectedUserId])

  const createChatRoom = async () => {
    const participantUserIds = [...new Set(selectedParticipantIds)]

    if (participantUserIds.length === 0) {
      setCreateError('참여자를 최소 1명 이상 선택하세요.')
      return
    }

    setCreateError('')
    setCreateLoading(true)

    try {
      const response = await fetch('/api/chat/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': String(selectedUserId),
        },
        body: JSON.stringify({
          type: createType,
          name: createName,
          participantUserIds,
        }),
      })

      if (!response.ok) {
        throw new Error('채팅방 생성에 실패했습니다.')
      }

      const payload = await response.json() as ApiResponse<CreateChatRoomResponse>
      const createdRoom = payload.data

      setMessagesByRoom((prev) => ({ ...prev, [createdRoom.chatId]: [] }))
      await fetchChatRooms(selectedUserId)
      await handleSelectRoom(createdRoom.chatId)
      setCreateName('')
      setSelectedParticipantIds([selectedUserId])
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : '채팅방 생성에 실패했습니다.')
    } finally {
      setCreateLoading(false)
    }
  }

  const sendMessage = () => {
    if (!input.trim()) return
    if (activeId === null) return
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return

    socketRef.current.send(buildFrame('SEND', {
      destination: '/pub/chat/message',
      'content-type': 'application/json',
      'X-User-Id': String(selectedUserId),
    }, JSON.stringify({
      chatId: activeId,
      content: input.trim(),
      messageType: 'TEXT',
    })))

    setInput('')
  }

  const handleDeleteMessage = async (messageId: number) => {
    if (activeId === null) {
      return
    }

    setOpenMessageMenuId(null)

    try {
      await deleteMessage(activeId, messageId)
      syncDeletedMessageInState(activeId, messageId)
      await markChatRoomAsRead(selectedUserId, activeId)
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : '메시지 삭제에 실패했습니다.')
    }
  }

  const handleLeaveRoom = async () => {
    if (activeId === null) {
      return
    }

    try {
      await leaveChatRoom(activeId)
      setActiveId(null)
      await fetchChatRooms(selectedUserId)
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : '채팅방 나가기에 실패했습니다.')
    }
  }

  const handleInviteParticipant = async () => {
    if (activeId === null) {
      return
    }

    try {
      await inviteParticipant(activeId, inviteUserId)
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : '참여자 초대에 실패했습니다.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div style={{ width: '100%', maxWidth: 1000, height: 820, display: 'flex', gap: 16 }}>

        <aside className="retro-window" style={{ width: 288, height: '100%', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div className="retro-title-bar" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>forum</span>
              <span style={{ fontWeight: 700 }}>채팅 목록</span>
            </div>
            <button className="retro-btn retro-btn-primary" style={{ padding: '2px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>edit</span> 새 채팅
            </button>
          </div>

          <div style={{ padding: '6px 8px', borderBottom: '1px solid #e3bfb1' }}>
            <div className="retro-inner-box" style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 8 }}>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(Number(e.target.value))}
                style={{ border: 'none', outline: 'none', fontFamily: 'Be Vietnam Pro', fontSize: 12, background: 'transparent' }}
              >
                {testUsers.map((testUser) => (
                  <option key={testUser.id} value={testUser.id}>
                    현재 테스트 유저: {testUser.nickname} ({testUser.id})
                  </option>
                ))}
              </select>
              <select
                value={createType}
                onChange={(e) => setCreateType(e.target.value as 'PRIVATE' | 'GROUP')}
                style={{ border: 'none', outline: 'none', fontFamily: 'Be Vietnam Pro', fontSize: 12, background: 'transparent' }}
              >
                <option value="PRIVATE">개인 채팅</option>
                <option value="GROUP">그룹 채팅</option>
              </select>
              <input
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder={createType === 'GROUP' ? '그룹 이름' : '개인 채팅 이름(선택)'}
                style={{ background: 'transparent', border: 'none', outline: 'none', fontFamily: 'Be Vietnam Pro', fontSize: 12 }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontFamily: 'Geist, monospace', fontSize: 11, color: '#5a4136' }}>
                  참여자 선택 (현재 유저 포함)
                </span>
                {testUsers.map((testUser) => {
                  const checked = selectedParticipantIds.includes(testUser.id)
                  const isCurrentUser = testUser.id === selectedUserId
                  return (
                    <label key={testUser.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Be Vietnam Pro', fontSize: 12 }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={isCurrentUser}
                        onChange={(e) => {
                          setSelectedParticipantIds((prev) => {
                            if (e.target.checked) {
                              return [...prev, testUser.id]
                            }
                            return prev.filter(id => id !== testUser.id)
                          })
                        }}
                      />
                      {testUser.nickname} ({testUser.id}){isCurrentUser ? ' - 현재 사용자' : ''}
                    </label>
                  )
                })}
              </div>
              <button
                className="retro-btn retro-btn-primary"
                onClick={createChatRoom}
                disabled={createLoading}
                style={{ padding: '6px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, opacity: createLoading ? 0.6 : 1 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 13 }}>add</span>
                채팅방 생성
              </button>
              {createError ? (
                <span style={{ fontFamily: 'Geist, monospace', fontSize: 11, color: '#ba1a1a' }}>{createError}</span>
              ) : null}
            </div>
          </div>

          <div style={{ padding: '6px 8px', borderBottom: '1px solid #e3bfb1', fontFamily: 'Geist, monospace', fontSize: 11, color: '#5a4136' }}>
            소켓 상태: {connectionStatus === 'connected' ? '연결됨' : connectionStatus === 'connecting' ? '연결 중' : '연결 끊김'}
          </div>

          <div className="retro-scrollbar" style={{ flex: 1, overflowY: 'auto', background: '#f9f9f9' }}>
            {chatRooms.length === 0 ? (
              <div style={{ padding: 16, fontFamily: 'Be Vietnam Pro', fontSize: 12, color: '#5a4136' }}>
                현재 사용자 기준으로 보이는 채팅방이 없습니다.
              </div>
            ) : null}
            {chatRooms.map((room) => (
              <div
                key={room.id}
                onClick={() => {
                  handleSelectRoom(room.id)
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '10px 8px',
                  borderBottom: '1px solid #e3bfb1', cursor: 'pointer',
                  background: activeId === room.id ? '#ffdbcd' : 'transparent',
                  borderLeft: activeId === room.id ? '4px solid #a33e00' : '4px solid transparent',
                  transition: 'background 0.1s',
                }}
              >
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div className="retro-inner-box" style={{ width: 40, height: 40, overflow: 'hidden', background: '#eeeeee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 24, color: '#5a4136', fontVariationSettings: "'FILL' 1" }}>person</span>
                  </div>
                  {room.online && (
                    <span style={{ position: 'absolute', bottom: -2, right: -2, width: 10, height: 10, background: '#22c55e', borderRadius: '50%', border: '1px solid white' }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
                    <span style={{ fontFamily: 'Geist, monospace', fontSize: 12, fontWeight: 700 }}>{room.name}</span>
                    <span style={{ fontFamily: 'Geist, monospace', fontSize: 10, color: '#5a4136' }}>{room.time}</span>
                  </div>
                  <p style={{ fontFamily: 'Be Vietnam Pro', fontSize: 12, color: '#5a4136', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {room.lastMsg || '메시지 없음'}
                  </p>
                </div>
                {room.unread ? (
                  <span style={{ background: '#ba1a1a', color: '#fff', fontFamily: 'Geist, monospace', fontSize: 10, borderRadius: 9999, padding: '1px 6px', flexShrink: 0 }}>{room.unread}</span>
                ) : null}
              </div>
            ))}
          </div>
        </aside>

        <section className="retro-window" style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div className="retro-title-bar" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ position: 'relative' }}>
                <div className="retro-inner-box" style={{ width: 36, height: 36, background: '#eeeeee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#5a4136', fontVariationSettings: "'FILL' 1" }}>person</span>
                </div>
                {activeRoom?.online ? (
                  <span style={{ position: 'absolute', bottom: -2, right: -2, width: 10, height: 10, background: '#22c55e', borderRadius: '50%', border: '1px solid white' }} />
                ) : null}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{activeRoom?.name ?? '채팅방을 선택하세요'}</div>
                <div style={{ fontSize: 10, color: activeRoom?.online ? '#15803d' : '#5a4136', fontWeight: 700 }}>
                  {activeRoom ? (activeRoom.online ? '● 접속 중' : '● 오프라인') : '● 미선택'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              {activeRoom?.type === 'GROUP' ? (
                <>
                  <select
                    value={inviteUserId}
                    onChange={(e) => setInviteUserId(Number(e.target.value))}
                    style={{ height: 24, fontFamily: 'Be Vietnam Pro', fontSize: 12 }}
                  >
                    {testUsers
                      .filter((user) => user.id !== selectedUserId)
                      .map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.nickname}
                        </option>
                      ))}
                  </select>
                  <button
                    className="retro-btn-gray"
                    onClick={handleInviteParticipant}
                    style={{ padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 13 }}>person_add</span>
                    초대
                  </button>
                </>
              ) : null}
              <button className="retro-btn-gray" style={{ padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 13 }}>person</span> 홈피
              </button>
              <button
                className="retro-btn-gray"
                onClick={handleLeaveRoom}
                disabled={activeId === null}
                style={{ padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4, opacity: activeId === null ? 0.6 : 1 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 13 }}>logout</span> 나가기
              </button>
              <button className="retro-btn-gray" style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>minimize</span>
              </button>
              <button className="retro-btn-gray" style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>crop_square</span>
              </button>
              <button style={{ width: 24, height: 24, background: '#ba1a1a', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
              </button>
            </div>
          </div>

          <div
            ref={messageContainerRef}
            className="retro-inner-box retro-scrollbar"
            style={{ flex: 1, padding: 16, margin: 8, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16, background: '#fff' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, borderTop: '1px solid #e3bfb1' }} />
              <span style={{ background: '#e2e2e2', color: '#5a4136', fontFamily: 'Geist, monospace', fontSize: 12, padding: '2px 8px', border: '1px solid #e3bfb1' }}>
                실시간 채팅 테스트
              </span>
              <div style={{ flex: 1, borderTop: '1px solid #e3bfb1' }} />
            </div>

            {messages.length === 0 ? (
              <div style={{ padding: '40px 0', textAlign: 'center', fontFamily: 'Be Vietnam Pro', fontSize: 13, color: '#5a4136' }}>
                {activeId === null ? '왼쪽에서 채팅방을 생성하거나 선택하세요.' : '아직 메시지가 없습니다.'}
              </div>
            ) : null}

            {activeId !== null && hasMoreByRoom[activeId] ? (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button
                  className="retro-btn-gray"
                  onClick={() => loadOlderMessages(activeId)}
                  disabled={loadingMoreRoomId === activeId}
                  style={{ padding: '4px 10px', fontSize: 12, opacity: loadingMoreRoomId === activeId ? 0.6 : 1 }}
                >
                  {loadingMoreRoomId === activeId ? '불러오는 중...' : '이전 메시지 더보기'}
                </button>
              </div>
            ) : null}

            {messages.map((msg) => (
              msg.messageType === 'SYSTEM' ? (
                <div key={msg.id} style={{ display: 'flex', justifyContent: 'center' }}>
                  <span
                    style={{
                      fontFamily: 'Be Vietnam Pro',
                      fontSize: 12,
                      color: '#6f6f6f',
                      background: '#f2f2f2',
                      border: '1px solid #e3e3e3',
                      padding: '4px 10px',
                    }}
                  >
                    {msg.text}
                  </span>
                </div>
              ) : (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.senderId === selectedUserId ? 'flex-end' : 'flex-start', maxWidth: '78%', alignSelf: msg.senderId === selectedUserId ? 'flex-end' : 'flex-start' }}>
                {msg.senderId !== selectedUserId ? (
                  <span style={{ fontFamily: 'Geist, monospace', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                    {activeRoom?.type === 'GROUP' ? getUserNickname(msg.senderId) : activeRoom?.name ?? '채팅방'}
                  </span>
                ) : null}
                <div style={{ position: 'relative' }}>
                  {msg.senderId === selectedUserId ? (
                    <button
                      className="retro-btn-gray"
                      onClick={() => setOpenMessageMenuId((prev) => prev === msg.id ? null : msg.id)}
                      style={{ position: 'absolute', top: 6, left: -34, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>more_horiz</span>
                    </button>
                  ) : null}
                  {openMessageMenuId === msg.id ? (
                    <div
                      className="retro-window"
                      style={{ position: 'absolute', top: 34, left: -40, zIndex: 20, minWidth: 92, padding: 4, background: '#fff7f4' }}
                    >
                      <button
                        className="retro-btn-gray"
                        onClick={() => handleDeleteMessage(msg.id)}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '6px 8px' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>delete</span>
                        삭제
                      </button>
                    </div>
                  ) : null}
                  <div style={{
                    background: msg.senderId === selectedUserId ? '#ff6600' : '#eeeeee',
                    color: msg.senderId === selectedUserId ? '#fff' : '#1a1c1c',
                    padding: '8px 10px',
                    border: msg.senderId === selectedUserId ? '1px solid #a33e00' : '1px solid #e3bfb1',
                    boxShadow: '1px 1px 0px rgba(0,0,0,0.1)',
                    fontFamily: 'Be Vietnam Pro',
                    fontSize: 14,
                    whiteSpace: 'pre-wrap',
                  }}>
                    {msg.text}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <span style={{ fontFamily: 'Geist, monospace', fontSize: 10, color: '#5a4136' }}>{msg.time}</span>
                  {msg.unreadMemberCount > 0 && (msg.senderId === selectedUserId || activeRoom?.type === 'GROUP') ? (
                    <span style={{ fontFamily: 'Geist, monospace', fontSize: 10, color: '#ba1a1a', fontWeight: 700 }}>
                      {msg.unreadMemberCount}
                    </span>
                  ) : null}
                </div>
              </div>
              )
            ))}

            <div ref={bottomRef} />
          </div>

          <div style={{ padding: 8, borderTop: '1px solid #e3bfb1', background: '#f9f9f9' }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              {['sentiment_satisfied', 'image', 'attach_file'].map(icon => (
                <button key={icon} className="retro-btn-gray" style={{ padding: '4px 6px', display: 'flex', alignItems: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{icon}</span>
                </button>
              ))}
              <span style={{ fontFamily: 'Geist, monospace', fontSize: 12, color: '#5a4136', marginLeft: 'auto', alignSelf: 'center' }}>
                현재 사용자: {selectedUser.nickname}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8, height: 80 }}>
              <textarea
                className="retro-inner-box"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.nativeEvent.isComposing) {
                    return
                  }
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
                placeholder="메시지를 입력하세요..."
                style={{ flex: 1, height: '100%', resize: 'none', padding: 8, fontFamily: 'Be Vietnam Pro', fontSize: 14, outline: 'none' }}
                disabled={activeId === null}
              />
              <button
                className="retro-btn retro-btn-primary"
                onClick={sendMessage}
                disabled={connectionStatus !== 'connected' || activeId === null}
                style={{ height: '100%', padding: '0 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, opacity: connectionStatus === 'connected' ? 1 : 0.6 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}>send</span>
                <span>전송</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
