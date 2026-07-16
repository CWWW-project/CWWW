import type { KeyboardEvent } from 'react'

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
  currentUser,
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
}: ChatPageViewProps) {
  const handleTextareaKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.nativeEvent.isComposing) {
      return
    }
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      sendMessage()
    }
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
            <div style={{ fontFamily: 'Geist, monospace', fontSize: 11, color: '#7a5c50' }}>
              현재 사용자: {currentUser?.nickname ?? '알 수 없음'}
            </div>
          </div>
        </div>
      </div>
    )
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
          </div>

          <div style={{ padding: '6px 8px', borderBottom: '1px solid #e3bfb1' }}>
            <div className="retro-inner-box" style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 8 }}>
              <div style={{ fontFamily: 'Geist, monospace', fontSize: 12, color: '#5a4136' }}>
                현재 사용자: {currentUser?.nickname ?? '알 수 없음'}
              </div>
              <select
                value={createType}
                onChange={(event) => setCreateType(event.target.value as 'PRIVATE' | 'GROUP')}
                style={{ border: 'none', outline: 'none', fontFamily: 'Be Vietnam Pro', fontSize: 12, background: 'transparent' }}
              >
                <option value="PRIVATE">개인 채팅</option>
                <option value="GROUP">그룹 채팅</option>
              </select>
              <input
                value={createName}
                onChange={(event) => setCreateName(event.target.value)}
                placeholder={createType === 'GROUP' ? '그룹 이름' : '개인 채팅 이름(선택)'}
                style={{ background: 'transparent', border: 'none', outline: 'none', fontFamily: 'Be Vietnam Pro', fontSize: 12 }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontFamily: 'Geist, monospace', fontSize: 11, color: '#5a4136' }}>
                  참여자 선택
                </span>
                {friendCandidates.length === 0 ? (
                  <span style={{ fontFamily: 'Be Vietnam Pro', fontSize: 12, color: '#5a4136' }}>
                    초대할 친구가 없습니다.
                  </span>
                ) : friendCandidates.map((candidate) => {
                  const checked = selectedParticipantIds.includes(candidate.userId)
                  return (
                    <label key={candidate.userId} style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Be Vietnam Pro', fontSize: 12 }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) => {
                          setSelectedParticipantIds((prev) => {
                            if (event.target.checked) {
                              return [...prev, candidate.userId]
                            }
                            return prev.filter((id) => id !== candidate.userId)
                          })
                        }}
                      />
                      {candidate.nickname}
                    </label>
                  )
                })}
              </div>
              <button
                className="retro-btn retro-btn-primary"
                onClick={handleCreateChatRoom}
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

        <section className="retro-window" style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <div className="retro-title-bar" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              {activeRoom?.type === 'GROUP' ? (
                <>
                  <select
                    value={inviteUserId ?? ''}
                    onChange={(event) => setInviteUserId(Number(event.target.value))}
                    style={{ height: 24, fontFamily: 'Be Vietnam Pro', fontSize: 12 }}
                  >
                    {friendCandidates.map((candidate) => (
                      <option key={candidate.userId} value={candidate.userId}>
                        {candidate.nickname}
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
            style={{ flex: 1, padding: 16, margin: 8, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16, background: '#fff', visibility: isRoomViewportSettling ? 'hidden' : 'visible' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, borderTop: '1px solid #e3bfb1' }} />
              <span style={{ background: '#e2e2e2', color: '#5a4136', fontFamily: 'Geist, monospace', fontSize: 12, padding: '2px 8px', border: '1px solid #e3bfb1' }}>
                실시간 채팅 테스트
              </span>
              <div style={{ flex: 1, borderTop: '1px solid #e3bfb1' }} />
            </div>

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
                <div key={message.id} style={{ display: 'flex', flexDirection: 'column', alignItems: message.senderId === currentUserId ? 'flex-end' : 'flex-start', maxWidth: '78%', alignSelf: message.senderId === currentUserId ? 'flex-end' : 'flex-start' }}>
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
              <span style={{ fontFamily: 'Geist, monospace', fontSize: 12, color: '#5a4136', marginLeft: 'auto', alignSelf: 'center' }}>
                현재 사용자: {currentUser?.nickname ?? '알 수 없음'}
              </span>
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
            <div style={{ display: 'flex', gap: 8, height: 80 }}>
              <textarea
                ref={textareaRef}
                className="retro-inner-box"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleTextareaKeyDown}
                placeholder={pendingAttachments.length > 0 ? '첨부와 함께 보낼 메시지를 입력하세요...' : '메시지를 입력하세요...'}
                style={{ flex: 1, height: '100%', resize: 'none', padding: 8, fontFamily: 'Be Vietnam Pro', fontSize: 14, outline: 'none' }}
                disabled={activeId === null}
              />
              <button
                className="retro-btn retro-btn-primary"
                onClick={sendMessage}
                disabled={connectionStatus !== 'connected' || activeId === null || (!input.trim() && pendingAttachments.length === 0)}
                style={{ height: '100%', padding: '0 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, opacity: (connectionStatus === 'connected' && activeId !== null && (input.trim() || pendingAttachments.length > 0)) ? 1 : 0.6 }}
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
