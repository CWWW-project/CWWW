import { useState, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import type { useChatPage } from './useChatPage'

type ChatPageViewProps = ReturnType<typeof useChatPage>

function getUserNickname(userId: number, participants: ChatPageViewProps['activeParticipants']): string {
  const matchedUser = participants.find((user) => user.userId === userId)
  return matchedUser ? matchedUser.nickname : `유저 ${userId}`
}

function isImageUrl(mediaUrl: string): boolean {
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(mediaUrl)
}

export function ChatPageView({
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
  inviteUserIds,
  isReady,
  isRoomViewportSettling,
  isSending,
  isSocketConnected,
  loadingMoreRoomId,
  loadOlderMessages,
  messageContainerRef,
  messages,
  openMessageMenuId,
  pendingAttachments,
  removePendingAttachment,
  selectedParticipantIds,
  currentUserId,
  friendCandidates,
  sendMessage,
  setCreateError,
  setCreateName,
  setCreateType,
  setInput,
  setInviteUserIds,
  setOpenMessageMenuId,
  setSelectedParticipantIds,
  textareaRef,
}: ChatPageViewProps) {
  const navigate = useNavigate()
  const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false)
  const [isInvitePanelOpen, setIsInvitePanelOpen] = useState(false)
  const [isHomePanelOpen, setIsHomePanelOpen] = useState(false)

  const handleTextareaKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.nativeEvent.isComposing) {
      return
    }
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      sendMessage()
    }
  }

  const handleOpenCreatePanel = () => {
    setCreateError('')
    setCreateType('PRIVATE')
    setCreateName('')
    setSelectedParticipantIds([])
    setIsCreatePanelOpen(true)
  }

  const handleCloseCreatePanel = () => {
    if (createLoading) return
    setCreateError('')
    setCreateName('')
    setSelectedParticipantIds([])
    setIsCreatePanelOpen(false)
  }

  const handleChangeCreateType = (nextType: 'PRIVATE' | 'GROUP') => {
    setCreateType(nextType)
    if (nextType === 'PRIVATE') {
      setCreateName('')
    }
    setSelectedParticipantIds((prev) => nextType === 'PRIVATE' ? prev.slice(0, 1) : prev)
  }

  const handleToggleCreateParticipant = (userId: number, checked: boolean) => {
    setSelectedParticipantIds((prev) => {
      if (!checked) {
        return prev.filter((id) => id !== userId)
      }
      if (createType === 'PRIVATE') {
        return [userId]
      }
      return prev.includes(userId) ? prev : [...prev, userId]
    })
  }

  const handleSubmitCreateRoom = async () => {
    const created = await handleCreateChatRoom()
    if (created) {
      setIsCreatePanelOpen(false)
    }
  }

  const inviteCandidates = friendCandidates.filter(
    (candidate) => !activeParticipants.some((participant) => participant.userId === candidate.userId),
  )

  const handleOpenInvitePanel = () => {
    setCreateError('')
    setInviteUserIds([])
    setIsInvitePanelOpen(true)
  }

  const handleCloseInvitePanel = () => {
    setCreateError('')
    setIsInvitePanelOpen(false)
  }

  const handleSubmitInviteParticipant = async () => {
    const invited = await handleInviteParticipant()
    if (invited) {
      setIsInvitePanelOpen(false)
    }
  }

  const handleToggleInviteParticipant = (userId: number, checked: boolean) => {
    setInviteUserIds((prev) => {
      if (!checked) {
        return prev.filter((id) => id !== userId)
      }
      return prev.includes(userId) ? prev : [...prev, userId]
    })
  }

  const privateRoomOpponentId = activeRoom?.type === 'PRIVATE'
    ? activeParticipants.find((participant) => participant.userId !== currentUserId)?.userId
    : null
  const homeCandidates = activeParticipants.filter((participant) => participant.userId !== currentUserId)

  const handleGoToOpponentHome = () => {
    if (activeRoom?.type === 'GROUP') {
      setIsHomePanelOpen(true)
      return
    }

    if (privateRoomOpponentId !== null && privateRoomOpponentId !== undefined) {
      navigate(`/home/${privateRoomOpponentId}`)
    }
  }

  const handleCloseHomePanel = () => {
    setIsHomePanelOpen(false)
  }

  const handleGoToParticipantHome = (userId: number) => {
    setIsHomePanelOpen(false)
    navigate(`/home/${userId}`)
  }

  const handleGoHome = () => {
    navigate('/')
  }

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="retro-window" style={{ width: '100%', maxWidth: 360, padding: 24, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div className="retro-title-bar" style={{ width: '100%', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700 }}>채팅 준비 중</span>
          </div>
          <div className="retro-inner-box" style={{ width: '100%', padding: 20, textAlign: 'center' }}>
            <div style={{ fontFamily: 'Be Vietnam Pro', fontSize: 14, color: '#5a4136', marginBottom: 6 }}>
              채팅방 목록과 소켓 연결을 불러오는 중입니다.
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-2 md:p-4">
      <div className="chat-page-shell">
        <aside className="retro-window chat-room-list">
          <div className="retro-title-bar" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>forum</span>
              <span style={{ fontWeight: 700 }}>채팅 목록</span>
            </div>
            <button
              type="button"
              className="retro-btn-gray"
              onClick={handleOpenCreatePanel}
              style={{ width: 28, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="채팅방 생성"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
            </button>
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
                onClick={() => handleSelectRoom(room.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 8px',
                  borderBottom: '1px solid #e3bfb1',
                  cursor: 'pointer',
                  background: activeId === room.id ? '#ffdbcd' : 'transparent',
                  borderLeft: activeId === room.id ? '4px solid #a33e00' : '4px solid transparent',
                  transition: 'background 0.1s',
                }}
              >
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div className="retro-inner-box" style={{ width: 40, height: 40, overflow: 'hidden', background: '#eeeeee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 24, color: '#5a4136', fontVariationSettings: "'FILL' 1" }}>person</span>
                  </div>
                  {isSocketConnected ? (
                    <span style={{ position: 'absolute', bottom: -2, right: -2, width: 10, height: 10, background: '#22c55e', borderRadius: '50%', border: '1px solid white' }} />
                  ) : null}
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

        {isCreatePanelOpen ? (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1100,
              background: 'rgba(45, 31, 25, 0.28)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                handleCloseCreatePanel()
              }
            }}
          >
            <div className="retro-window" style={{ width: '100%', maxWidth: 420, background: '#fff7f4' }}>
              <div className="retro-title-bar" style={{ justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add_comment</span>
                  <span style={{ fontWeight: 700 }}>채팅방 생성</span>
                </div>
                <button
                  type="button"
                  className="retro-btn-gray"
                  onClick={handleCloseCreatePanel}
                  disabled={createLoading}
                  style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: createLoading ? 0.6 : 1 }}
                  title="닫기"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                </button>
              </div>

              <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <button
                    type="button"
                    className={createType === 'PRIVATE' ? 'retro-btn retro-btn-primary' : 'retro-btn-gray'}
                    onClick={() => handleChangeCreateType('PRIVATE')}
                    style={{ padding: '8px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person</span>
                    1:1
                  </button>
                  <button
                    type="button"
                    className={createType === 'GROUP' ? 'retro-btn retro-btn-primary' : 'retro-btn-gray'}
                    onClick={() => handleChangeCreateType('GROUP')}
                    style={{ padding: '8px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>groups</span>
                    단체
                  </button>
                </div>

                {createType === 'GROUP' ? (
                  <input
                    value={createName}
                    onChange={(event) => setCreateName(event.target.value)}
                    placeholder="단체 채팅방 이름"
                    className="retro-inner-box"
                    style={{ height: 36, padding: '0 10px', background: '#fff', outline: 'none', fontFamily: 'Be Vietnam Pro', fontSize: 13 }}
                  />
                ) : null}

                <div className="retro-inner-box" style={{ background: '#fff', padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontFamily: 'Geist, monospace', fontSize: 12, fontWeight: 700, color: '#5a4136' }}>
                      일촌 목록
                    </span>
                    <span style={{ fontFamily: 'Geist, monospace', fontSize: 11, color: '#7a5c50' }}>
                      {createType === 'PRIVATE' ? '1명 선택' : `${selectedParticipantIds.length}명 선택`}
                    </span>
                  </div>

                  <div className="retro-scrollbar" style={{ maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {friendCandidates.length === 0 ? (
                      <div style={{ padding: 16, textAlign: 'center', fontFamily: 'Be Vietnam Pro', fontSize: 12, color: '#5a4136' }}>
                        선택할 수 있는 일촌이 없습니다.
                      </div>
                    ) : friendCandidates.map((candidate) => {
                      const checked = selectedParticipantIds.includes(candidate.userId)
                      return (
                        <label
                          key={candidate.userId}
                          className="retro-inner-box"
                          style={{
                            minHeight: 42,
                            padding: '8px 10px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            background: checked ? '#ffdbcd' : '#fafafa',
                            cursor: 'pointer',
                          }}
                        >
                          <input
                            type={createType === 'PRIVATE' ? 'radio' : 'checkbox'}
                            name="chat-create-participant"
                            checked={checked}
                            onChange={(event) => handleToggleCreateParticipant(candidate.userId, event.target.checked)}
                          />
                          <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#5a4136', fontVariationSettings: "'FILL' 1" }}>person</span>
                          <span style={{ fontFamily: 'Be Vietnam Pro', fontSize: 13, color: '#2f211c', fontWeight: 600 }}>
                            {candidate.nickname}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </div>

                {createError ? (
                  <div style={{ fontFamily: 'Geist, monospace', fontSize: 11, color: '#ba1a1a' }}>{createError}</div>
                ) : null}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button
                    type="button"
                    className="retro-btn-gray"
                    onClick={handleCloseCreatePanel}
                    disabled={createLoading}
                    style={{ padding: '7px 12px', opacity: createLoading ? 0.6 : 1 }}
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    className="retro-btn retro-btn-primary"
                    onClick={handleSubmitCreateRoom}
                    disabled={createLoading || selectedParticipantIds.length === 0}
                    style={{ padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 6, opacity: createLoading || selectedParticipantIds.length === 0 ? 0.6 : 1 }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 15 }}>check</span>
                    {createLoading ? '생성 중' : '생성'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {isInvitePanelOpen ? (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1100,
              background: 'rgba(45, 31, 25, 0.28)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                handleCloseInvitePanel()
              }
            }}
          >
            <div className="retro-window" style={{ width: '100%', maxWidth: 400, background: '#fff7f4' }}>
              <div className="retro-title-bar" style={{ justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person_add</span>
                  <span style={{ fontWeight: 700 }}>일촌 초대</span>
                </div>
                <button
                  type="button"
                  className="retro-btn-gray"
                  onClick={handleCloseInvitePanel}
                  style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="닫기"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                </button>
              </div>

              <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="retro-inner-box" style={{ background: '#fff', padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontFamily: 'Geist, monospace', fontSize: 12, fontWeight: 700, color: '#5a4136' }}>
                      초대할 일촌
                    </span>
                    <span style={{ fontFamily: 'Geist, monospace', fontSize: 11, color: '#7a5c50' }}>
                      {inviteUserIds.length}명 선택
                    </span>
                  </div>

                  <div className="retro-scrollbar" style={{ maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {inviteCandidates.length === 0 ? (
                      <div style={{ padding: 16, textAlign: 'center', fontFamily: 'Be Vietnam Pro', fontSize: 12, color: '#5a4136' }}>
                        초대할 수 있는 일촌이 없습니다.
                      </div>
                    ) : inviteCandidates.map((candidate) => {
                      const checked = inviteUserIds.includes(candidate.userId)
                      return (
                        <label
                          key={candidate.userId}
                          className="retro-inner-box"
                          style={{
                            minHeight: 42,
                            padding: '8px 10px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            background: checked ? '#ffdbcd' : '#fafafa',
                            cursor: 'pointer',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(event) => handleToggleInviteParticipant(candidate.userId, event.target.checked)}
                          />
                          <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#5a4136', fontVariationSettings: "'FILL' 1" }}>person</span>
                          <span style={{ fontFamily: 'Be Vietnam Pro', fontSize: 13, color: '#2f211c', fontWeight: 600 }}>
                            {candidate.nickname}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </div>

                {createError ? (
                  <div style={{ fontFamily: 'Geist, monospace', fontSize: 11, color: '#ba1a1a' }}>{createError}</div>
                ) : null}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button
                    type="button"
                    className="retro-btn-gray"
                    onClick={handleCloseInvitePanel}
                    style={{ padding: '7px 12px' }}
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    className="retro-btn retro-btn-primary"
                    onClick={handleSubmitInviteParticipant}
                    disabled={inviteUserIds.length === 0}
                    style={{ padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 6, opacity: inviteUserIds.length === 0 ? 0.6 : 1 }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 15 }}>person_add</span>
                    초대
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {isHomePanelOpen ? (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1100,
              background: 'rgba(45, 31, 25, 0.28)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                handleCloseHomePanel()
              }
            }}
          >
            <div className="retro-window" style={{ width: '100%', maxWidth: 380, background: '#fff7f4' }}>
              <div className="retro-title-bar" style={{ justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>home</span>
                  <span style={{ fontWeight: 700 }}>홈피로 이동</span>
                </div>
                <button
                  type="button"
                  className="retro-btn-gray"
                  onClick={handleCloseHomePanel}
                  style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="닫기"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                </button>
              </div>

              <div style={{ padding: 12 }}>
                <div className="retro-inner-box" style={{ background: '#fff', padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {homeCandidates.length === 0 ? (
                    <div style={{ padding: 16, textAlign: 'center', fontFamily: 'Be Vietnam Pro', fontSize: 12, color: '#5a4136' }}>
                      이동할 수 있는 참여자가 없습니다.
                    </div>
                  ) : homeCandidates.map((participant) => (
                    <button
                      key={participant.userId}
                      type="button"
                      className="retro-inner-box"
                      onClick={() => handleGoToParticipantHome(participant.userId)}
                      style={{
                        minHeight: 42,
                        padding: '8px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        background: '#fafafa',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#5a4136', fontVariationSettings: "'FILL' 1" }}>person</span>
                      <span style={{ fontFamily: 'Be Vietnam Pro', fontSize: 13, color: '#2f211c', fontWeight: 600 }}>
                        {participant.nickname}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <section className="retro-window chat-room-panel">
          <div className="retro-title-bar chat-room-title-bar" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                className="retro-btn-gray"
                onClick={handleGoHome}
                style={{ width: 28, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                title="홈으로 돌아가기"
                aria-label="홈으로 돌아가기"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
              </button>
              <div style={{ position: 'relative' }}>
                <div className="retro-inner-box" style={{ width: 36, height: 36, background: '#eeeeee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#5a4136', fontVariationSettings: "'FILL' 1" }}>person</span>
                </div>
                {activeRoom?.type === 'PRIVATE' && isSocketConnected ? (
                  <span style={{ position: 'absolute', bottom: -2, right: -2, width: 10, height: 10, background: '#22c55e', borderRadius: '50%', border: '1px solid white' }} />
                ) : null}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{activeRoom?.name ?? '채팅방을 선택하세요'}</div>
                {activeRoom?.type === 'PRIVATE' ? (
                  <div style={{ fontSize: 10, color: isSocketConnected ? '#15803d' : '#5a4136', fontWeight: 700 }}>
                    {isSocketConnected ? '● 접속 중' : '● 오프라인'}
                  </div>
                ) : null}
                {activeRoom?.type === 'GROUP' && activeParticipants.length > 0 ? (
                  <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {activeParticipants.map((participant) => (
                      <span
                        key={participant.userId}
                        style={{
                          fontFamily: 'Be Vietnam Pro',
                          fontSize: 11,
                          color: '#5a4136',
                          background: '#f3e4dc',
                          border: '1px solid #e3bfb1',
                          padding: '2px 6px',
                          borderRadius: 9999,
                        }}
                      >
                        {participant.nickname}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
            <div className="chat-room-actions" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              {activeRoom?.type === 'GROUP' ? (
                <button
                  className="retro-btn-gray"
                  onClick={handleOpenInvitePanel}
                  style={{ padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 13 }}>person_add</span>
                  초대
                </button>
              ) : null}
              <button
                className="retro-btn-gray"
                onClick={handleGoToOpponentHome}
                disabled={activeRoom === null || (activeRoom.type === 'PRIVATE' && (privateRoomOpponentId === null || privateRoomOpponentId === undefined)) || (activeRoom.type === 'GROUP' && homeCandidates.length === 0)}
                style={{
                  padding: '3px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  opacity: activeRoom === null || (activeRoom.type === 'PRIVATE' && (privateRoomOpponentId === null || privateRoomOpponentId === undefined)) || (activeRoom.type === 'GROUP' && homeCandidates.length === 0) ? 0.6 : 1,
                }}
              >
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
            className="retro-inner-box retro-scrollbar chat-message-list"
            style={{ flex: 1, padding: 16, margin: 8, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16, background: '#fff', visibility: isRoomViewportSettling ? 'hidden' : 'visible' }}
          >
            {isRoomViewportSettling ? (
              <div style={{ padding: '40px 0', textAlign: 'center', fontFamily: 'Be Vietnam Pro', fontSize: 13, color: '#5a4136' }}>
                메시지를 불러오는 중입니다.
              </div>
            ) : messages.length === 0 ? (
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

            {messages.map((message) => (
              message.messageType === 'SYSTEM' ? (
                <div key={message.id} style={{ display: 'flex', justifyContent: 'center' }}>
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
                    {message.text}
                  </span>
                </div>
              ) : (
                <div key={message.id} className="chat-message-item" style={{ display: 'flex', flexDirection: 'column', alignItems: message.senderId === currentUserId ? 'flex-end' : 'flex-start', maxWidth: '78%', alignSelf: message.senderId === currentUserId ? 'flex-end' : 'flex-start' }}>
                  {message.senderId !== currentUserId ? (
                    <span style={{ fontFamily: 'Geist, monospace', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                      {activeRoom?.type === 'GROUP' ? getUserNickname(message.senderId, activeParticipants) : activeRoom?.name ?? '채팅방'}
                    </span>
                  ) : null}
                  <div style={{ position: 'relative' }}>
                    {message.senderId === currentUserId ? (
                      <button
                        className="retro-btn-gray"
                        onClick={() => setOpenMessageMenuId((prev) => (prev === message.id ? null : message.id))}
                        style={{ position: 'absolute', top: 6, left: -34, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>more_horiz</span>
                      </button>
                    ) : null}
                    {openMessageMenuId === message.id ? (
                      <div
                        className="retro-window"
                        style={{ position: 'absolute', top: 34, left: -40, zIndex: 20, minWidth: 92, padding: 4, background: '#fff7f4' }}
                      >
                        <button
                          className="retro-btn-gray"
                          onClick={() => handleDeleteMessage(message.id)}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '6px 8px' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>delete</span>
                          삭제
                        </button>
                      </div>
                    ) : null}
                    <div style={{
                      background: message.senderId === currentUserId ? '#ff6600' : '#eeeeee',
                      color: message.senderId === currentUserId ? '#fff' : '#1a1c1c',
                      padding: '8px 10px',
                      border: message.senderId === currentUserId ? '1px solid #a33e00' : '1px solid #e3bfb1',
                      boxShadow: '1px 1px 0px rgba(0,0,0,0.1)',
                      fontFamily: 'Be Vietnam Pro',
                      fontSize: 14,
                      whiteSpace: 'pre-wrap',
                    }}>
                      {message.mediaUrls.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: message.text ? 8 : 0 }}>
                          {message.mediaUrls.map((mediaUrl) => (
                            isImageUrl(mediaUrl) ? (
                              <img
                                key={mediaUrl}
                                src={mediaUrl}
                                alt="첨부 이미지"
                                className="chat-message-media"
                                style={{ maxWidth: 240, maxHeight: 240, objectFit: 'cover', border: '1px solid rgba(0,0,0,0.15)' }}
                              />
                            ) : (
                              <a
                                key={mediaUrl}
                                href={mediaUrl}
                                target="_blank"
                                rel="noreferrer"
                                style={{ color: 'inherit', textDecoration: 'underline', wordBreak: 'break-all' }}
                              >
                                {mediaUrl.split('/').pop() ?? '첨부 파일'}
                              </a>
                            )
                          ))}
                        </div>
                      ) : null}
                      {message.text}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <span style={{ fontFamily: 'Geist, monospace', fontSize: 10, color: '#5a4136' }}>{message.time}</span>
                    {message.unreadMemberCount > 0 && (message.senderId === currentUserId || activeRoom?.type === 'GROUP') ? (
                      <span style={{ fontFamily: 'Geist, monospace', fontSize: 10, color: '#ba1a1a', fontWeight: 700 }}>
                        {message.unreadMemberCount}
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
              <button
                className="retro-btn-gray"
                onClick={handleOpenFilePicker}
                disabled={activeId === null}
                style={{ padding: '4px 6px', display: 'flex', alignItems: 'center', opacity: activeId === null ? 0.6 : 1 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>add</span>
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              hidden
              onChange={(event) => {
                handleFilesSelected(event.target.files)
                event.target.value = ''
              }}
            />
            {pendingAttachments.length > 0 ? (
              <div className="retro-inner-box" style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: 8, marginBottom: 8 }}>
                {pendingAttachments.map((attachment) => (
                  <div key={attachment.id} style={{ position: 'relative', width: 88, flexShrink: 0 }}>
                    <button
                      className="retro-btn-gray"
                      onClick={() => removePendingAttachment(attachment.id)}
                      style={{ position: 'absolute', top: -4, right: -4, zIndex: 1, width: 20, height: 20, padding: 0 }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 12 }}>close</span>
                    </button>
                    {attachment.isImage ? (
                      <img
                        src={attachment.previewUrl}
                        alt={attachment.file.name}
                        style={{ width: 88, height: 88, objectFit: 'cover', border: '1px solid #e3bfb1', background: '#fff' }}
                      />
                    ) : (
                      <div style={{ width: 88, height: 88, border: '1px solid #e3bfb1', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 32, color: '#5a4136' }}>attach_file</span>
                      </div>
                    )}
                    <div style={{ marginTop: 4, fontFamily: 'Be Vietnam Pro', fontSize: 11, color: '#5a4136', wordBreak: 'break-all' }}>
                      {attachment.file.name}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
            <div className="chat-input-row" style={{ display: 'flex', gap: 8, height: 80 }}>
              <textarea
                ref={textareaRef}
                className="retro-inner-box"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleTextareaKeyDown}
                placeholder={pendingAttachments.length > 0 ? '첨부와 함께 보낼 메시지를 입력하세요...' : '메시지를 입력하세요...'}
                style={{ flex: 1, height: '100%', resize: 'none', padding: 8, fontFamily: 'Be Vietnam Pro', fontSize: 14, outline: 'none' }}
                disabled={activeId === null || isSending}
              />
              <button
                className="retro-btn retro-btn-primary chat-send-button"
                onClick={sendMessage}
                disabled={isSending || connectionStatus !== 'connected' || activeId === null || (!input.trim() && pendingAttachments.length === 0)}
                style={{ height: '100%', padding: '0 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, opacity: (!isSending && connectionStatus === 'connected' && activeId !== null && (input.trim() || pendingAttachments.length > 0)) ? 1 : 0.6 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}>send</span>
                <span>{isSending ? '전송 중' : '전송'}</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
