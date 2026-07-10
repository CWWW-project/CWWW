import { useState, useRef, useEffect } from 'react'

interface ChatUser {
  id: number
  name: string
  lastMsg: string
  time: string
  online: boolean
  unread?: number
}

const chatList: ChatUser[] = [
  { id: 1, name: '김찬호', lastMsg: 'ㅋㅋ 나도 이제 구현 다 했어!', time: '오후 2:30', online: true, unread: 3 },
  { id: 2, name: '윤주원', lastMsg: 'OAuth2 연동 완료했어~ 🎉', time: '오전 11:15', online: true },
  { id: 3, name: '김채린', lastMsg: '사진 업로드 테스트 해봐줄 수 있어?', time: '어제', online: false },
  { id: 4, name: '장수호', lastMsg: 'EC2 설정 끝냈어 확인해봐', time: '2일 전', online: false },
  { id: 5, name: '정용혁', lastMsg: '미니룸 DnD 구현 중...', time: '3일 전', online: false },
]

interface Message {
  id: number
  text: string
  time: string
  outgoing: boolean
  read?: boolean
}

const initialMessages: Message[] = [
  { id: 1, text: '야 너 AUTH 파트 다 됐어?? 빨리 PR 올려라 ㅋㅋ', time: '오전 10:22', outgoing: false },
  { id: 2, text: 'ㅋㅋㅋ 거의 다 됐어 JWT Refresh 마무리 중이야', time: '오전 10:24', outgoing: true, read: true },
  { id: 3, text: '나는 WebSocket STOMP 연결까지 됐는데\nRedis Pub/Sub에서 자꾸 막혀...', time: '오전 10:26', outgoing: false },
  { id: 4, text: 'Redis config에서 MessageListenerContainer\n설정 확인해봐. 거기서 자주 막혀', time: '오전 10:28', outgoing: true, read: true },
  { id: 5, text: 'ㅋㅋㅋ 나도 이제 구현 다 했어! PR 올릴게 🎉', time: '오후 2:30', outgoing: false },
  { id: 6, text: '오 ㅋㅋ 굳 코드래빗이 리뷰해줄 거야 🐰', time: '오후 2:31', outgoing: true, read: false },
]

export default function ChatPage() {
  const [activeId, setActiveId] = useState(1)
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const activeUser = chatList.find(c => c.id === activeId)!

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = () => {
    if (!input.trim()) return
    setMessages(prev => [...prev, {
      id: prev.length + 1,
      text: input,
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      outgoing: true,
      read: false,
    }])
    setInput('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div style={{ width: '100%', maxWidth: 1000, height: 820, display: 'flex', gap: 16 }}>

        {/* Left: Chat List */}
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

          {/* Search */}
          <div style={{ padding: '6px 8px', borderBottom: '1px solid #e3bfb1' }}>
            <div className="retro-inner-box" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 6px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#5a4136' }}>search</span>
              <input placeholder="대화 검색..." style={{ background: 'transparent', border: 'none', outline: 'none', fontFamily: 'Be Vietnam Pro', fontSize: 12, flex: 1 }} />
            </div>
          </div>

          {/* List */}
          <div className="retro-scrollbar" style={{ flex: 1, overflowY: 'auto', background: '#f9f9f9' }}>
            {chatList.map(user => (
              <div
                key={user.id}
                onClick={() => setActiveId(user.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '10px 8px',
                  borderBottom: '1px solid #e3bfb1', cursor: 'pointer',
                  background: activeId === user.id ? '#ffdbcd' : 'transparent',
                  borderLeft: activeId === user.id ? '4px solid #a33e00' : '4px solid transparent',
                  transition: 'background 0.1s',
                }}
              >
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div className="retro-inner-box" style={{ width: 40, height: 40, overflow: 'hidden', background: '#eeeeee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 24, color: '#5a4136', fontVariationSettings: "'FILL' 1" }}>person</span>
                  </div>
                  {user.online && (
                    <span style={{ position: 'absolute', bottom: -2, right: -2, width: 10, height: 10, background: '#22c55e', borderRadius: '50%', border: '1px solid white' }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
                    <span style={{ fontFamily: 'Geist, monospace', fontSize: 12, fontWeight: 700 }}>{user.name}</span>
                    <span style={{ fontFamily: 'Geist, monospace', fontSize: 10, color: '#5a4136' }}>{user.time}</span>
                  </div>
                  <p style={{ fontFamily: 'Be Vietnam Pro', fontSize: 12, color: '#5a4136', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.lastMsg}</p>
                </div>
                {user.unread && (
                  <span style={{ background: '#ba1a1a', color: '#fff', fontFamily: 'Geist, monospace', fontSize: 10, borderRadius: 9999, padding: '1px 6px', flexShrink: 0 }}>{user.unread}</span>
                )}
              </div>
            ))}
          </div>
        </aside>

        {/* Right: Chat Window */}
        <section className="retro-window" style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Title Bar */}
          <div className="retro-title-bar" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ position: 'relative' }}>
                <div className="retro-inner-box" style={{ width: 36, height: 36, background: '#eeeeee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#5a4136', fontVariationSettings: "'FILL' 1" }}>person</span>
                </div>
                {activeUser.online && (
                  <span style={{ position: 'absolute', bottom: -2, right: -2, width: 10, height: 10, background: '#22c55e', borderRadius: '50%', border: '1px solid white' }} />
                )}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{activeUser.name}</div>
                <div style={{ fontSize: 10, color: activeUser.online ? '#15803d' : '#5a4136', fontWeight: 700 }}>
                  {activeUser.online ? '● 접속 중' : '● 오프라인'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <button className="retro-btn-gray" style={{ padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 13 }}>person</span> 홈피
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

          {/* Messages */}
          <div className="retro-inner-box retro-scrollbar" style={{ flex: 1, padding: 16, margin: 8, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16, background: '#fff' }}>
            {/* Date Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, borderTop: '1px solid #e3bfb1' }} />
              <span style={{ background: '#e2e2e2', color: '#5a4136', fontFamily: 'Geist, monospace', fontSize: 12, padding: '2px 8px', border: '1px solid #e3bfb1' }}>
                2025년 7월 10일
              </span>
              <div style={{ flex: 1, borderTop: '1px solid #e3bfb1' }} />
            </div>

            {messages.map(msg => (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.outgoing ? 'flex-end' : 'flex-start', maxWidth: '78%', alignSelf: msg.outgoing ? 'flex-end' : 'flex-start' }}>
                {!msg.outgoing && (
                  <span style={{ fontFamily: 'Geist, monospace', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{activeUser.name}</span>
                )}
                <div style={{ position: 'relative' }}>
                  <div style={{
                    background: msg.outgoing ? '#ff6600' : '#eeeeee',
                    color: msg.outgoing ? '#fff' : '#1a1c1c',
                    padding: '8px 10px',
                    border: msg.outgoing ? '1px solid #a33e00' : '1px solid #e3bfb1',
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
                  {msg.outgoing && (
                    <>
                      <span className="material-symbols-outlined" style={{ fontSize: 12, color: msg.read ? '#0c6780' : '#5a4136', fontVariationSettings: "'FILL' 1" }}>
                        {msg.read ? 'done_all' : 'done'}
                      </span>
                      <span style={{ fontFamily: 'Geist, monospace', fontSize: 10, color: msg.read ? '#0c6780' : '#5a4136' }}>
                        {msg.read ? '읽음' : '전송됨'}
                      </span>
                    </>
                  )}
                </div>
              </div>
            ))}

            {/* Typing */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <div className="retro-inner-box" style={{ width: 36, height: 36, background: '#eeeeee', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#5a4136', fontVariationSettings: "'FILL' 1" }}>person</span>
              </div>
              <div style={{ background: '#eeeeee', padding: '8px 12px', border: '1px solid #e3bfb1', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </div>
            <div ref={bottomRef} />
          </div>

          {/* Input Area */}
          <div style={{ padding: 8, borderTop: '1px solid #e3bfb1', background: '#f9f9f9' }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              {['sentiment_satisfied', 'image', 'attach_file'].map(icon => (
                <button key={icon} className="retro-btn-gray" style={{ padding: '4px 6px', display: 'flex', alignItems: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{icon}</span>
                </button>
              ))}
              <span style={{ fontFamily: 'Geist, monospace', fontSize: 12, color: '#5a4136', marginLeft: 'auto', alignSelf: 'center' }}>Shift+Enter 줄바꿈</span>
            </div>
            <div style={{ display: 'flex', gap: 8, height: 80 }}>
              <textarea
                className="retro-inner-box"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                placeholder="메시지를 입력하세요..."
                style={{ flex: 1, height: '100%', resize: 'none', padding: 8, fontFamily: 'Be Vietnam Pro', fontSize: 14, outline: 'none' }}
              />
              <button
                className="retro-btn retro-btn-primary"
                onClick={sendMessage}
                style={{ height: '100%', padding: '0 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}
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
