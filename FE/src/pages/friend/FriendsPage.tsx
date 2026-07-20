import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { friendApi } from '../../api/friend'
import { useAuthStore } from '../../store/authStore'
import type { FriendResponse } from '../../types'

type Tab = '일촌 목록' | '받은 신청'

export default function FriendsPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [tab, setTab] = useState<Tab>('일촌 목록')
  const [friends, setFriends] = useState<FriendResponse[]>([])
  const [pending, setPending] = useState<FriendResponse[]>([])
  const [loading, setLoading] = useState(false)

  // 일촌 닉네임 편집
  const [editingFriendId, setEditingFriendId] = useState<number | null>(null)
  const [aliasInput, setAliasInput] = useState('')

  const loadFriends = useCallback(async () => {
    setLoading(true)
    try {
      const res = await friendApi.getFriends()
      setFriends(res.data.data)
    } catch (e) {
      console.error('일촌 목록 로드 실패', e)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadPending = useCallback(async () => {
    setLoading(true)
    try {
      const res = await friendApi.getPendingRequests()
      setPending(res.data.data)
    } catch (e) {
      console.error('신청 목록 로드 실패', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (tab === '일촌 목록') loadFriends()
    else loadPending()
  }, [tab, loadFriends, loadPending])

  const acceptRequest = async (friendId: number) => {
    try {
      await friendApi.acceptRequest(friendId)
      setPending(prev => prev.filter(f => f.friendId !== friendId))
    } catch (e) {
      console.error('수락 실패', e)
    }
  }

  const rejectRequest = async (friendId: number) => {
    try {
      await friendApi.rejectRequest(friendId)
      setPending(prev => prev.filter(f => f.friendId !== friendId))
    } catch (e) {
      console.error('거절 실패', e)
    }
  }

  const terminate = async (friendId: number) => {
    if (!window.confirm('정말 일촌을 끊으시겠어요?')) return
    try {
      await friendApi.terminate(friendId)
      setFriends(prev => prev.filter(f => f.friendId !== friendId))
    } catch (e) {
      console.error('일촌 끊기 실패', e)
    }
  }

  const getMyAlias = (f: FriendResponse) =>
    f.requesterId === user?.id ? f.requesterAlias : f.receiverAlias

  const startEditAlias = (friend: FriendResponse) => {
    setEditingFriendId(friend.friendId)
    setAliasInput(getMyAlias(friend) ?? '')
  }

  const saveAlias = async (friendId: number) => {
    try {
      await friendApi.setAlias(friendId, aliasInput.trim())
      setFriends(prev => prev.map(f => {
        if (f.friendId !== friendId) return f
        return f.requesterId === user?.id
          ? { ...f, requesterAlias: aliasInput.trim() }
          : { ...f, receiverAlias: aliasInput.trim() }
      }))
    } catch (e) {
      console.error('일촌 닉네임 설정 실패', e)
    } finally {
      setEditingFriendId(null)
    }
  }

  return (
    <div className="min-h-screen text-[#1a1c1c] py-6 flex justify-center items-start">
      <div className="max-w-[640px] w-full mx-auto px-4 flex flex-col gap-4">

        {/* 헤더 */}
        <div className="window-frame p-3 flex items-center gap-2">
          <button className="retro-btn p-1" onClick={() => navigate('/')}>
            <span className="material-symbols-outlined text-sm">arrow_back</span>
          </button>
          <span className="material-symbols-outlined text-[#a33e00]" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
          <h1 className="font-['Bricolage_Grotesque',sans-serif] text-[20px] font-bold text-[#a33e00]">일촌 관리</h1>
        </div>

        {/* 탭 */}
        <div className="flex gap-1">
          {(['일촌 목록', '받은 신청'] as Tab[]).map(t => (
            <button
              key={t}
              className={`retro-btn font-[Geist,monospace] text-[12px] font-semibold px-3 py-1.5${tab === t ? ' retro-btn-primary' : ''}`}
              onClick={() => setTab(t)}
            >{t}{t === '받은 신청' && pending.length > 0 ? ` (${pending.length})` : ''}</button>
          ))}
        </div>

        {/* 컨텐츠 */}
        <div className="window-inset border border-[#8e7164] bg-white flex flex-col">
          <div className="bg-[#e2e2e2] px-2 py-1 border-b border-[#8e7164] font-[Geist,monospace] text-[12px] font-semibold text-[#1a1c1c] flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">{tab === '일촌 목록' ? 'group' : 'mark_email_unread'}</span>
            {tab}
          </div>

          {loading ? (
            <div className="p-8 text-center font-[Geist,monospace] text-[12px] text-[#5a4136]">불러오는 중...</div>
          ) : tab === '일촌 목록' ? (
            friends.length === 0 ? (
              <div className="p-8 text-center font-[Geist,monospace] text-[12px] text-[#5a4136]">아직 일촌이 없어요.</div>
            ) : (
              <div className="flex flex-col">
                {friends.map((f, idx) => (
                  <div key={f.friendId} className={`p-2 flex items-center gap-2${idx < friends.length - 1 ? ' border-b border-[#e3bfb1]' : ''}`}>
                    <span className="material-symbols-outlined text-[#a33e00] text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>face</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-[Geist,monospace] text-[13px] font-bold text-[#a33e00]">{f.opponentNickname}</p>
                      {editingFriendId === f.friendId ? (
                        <div className="flex gap-1 mt-0.5">
                          <input
                            className="window-inset text-[11px] p-0.5 focus:outline-none flex-1"
                            value={aliasInput}
                            onChange={e => setAliasInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') saveAlias(f.friendId) }}
                            autoFocus
                            maxLength={20}
                          />
                          <button className="retro-btn retro-btn-primary font-[Geist,monospace] text-[11px] px-2 py-0.5" onClick={() => saveAlias(f.friendId)}>저장</button>
                          <button className="retro-btn font-[Geist,monospace] text-[11px] px-2 py-0.5" onClick={() => setEditingFriendId(null)}>취소</button>
                        </div>
                      ) : (
                        <p className="font-[Geist,monospace] text-[11px] text-[#5a4136]">
                          별칭: {getMyAlias(f) ?? '없음'}
                          <button className="ml-1 text-[#0c6780] hover:underline" onClick={() => startEditAlias(f)}>수정</button>
                        </p>
                      )}
                    </div>
                    <button
                      className="retro-btn font-[Geist,monospace] text-[11px] font-semibold px-2 py-1 text-[#ba1a1a]"
                      onClick={() => terminate(f.friendId)}
                    >끊기</button>
                  </div>
                ))}
              </div>
            )
          ) : (
            pending.length === 0 ? (
              <div className="p-8 text-center font-[Geist,monospace] text-[12px] text-[#5a4136]">받은 일촌 신청이 없어요.</div>
            ) : (
              <div className="flex flex-col">
                {pending.map((f, idx) => (
                  <div key={f.friendId} className={`p-2 flex items-center gap-2${idx < pending.length - 1 ? ' border-b border-[#e3bfb1]' : ''}`}>
                    <span className="material-symbols-outlined text-[#a33e00] text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>face</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-[Geist,monospace] text-[13px] font-bold text-[#a33e00]">{f.opponentNickname}</p>
                      <p className="font-[Geist,monospace] text-[11px] text-[#5a4136]">일촌 신청이 왔어요!</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        className="retro-btn retro-btn-primary font-[Geist,monospace] text-[12px] font-semibold px-3 py-1"
                        onClick={() => acceptRequest(f.friendId)}
                      >수락</button>
                      <button
                        className="retro-btn font-[Geist,monospace] text-[12px] font-semibold px-3 py-1"
                        onClick={() => rejectRequest(f.friendId)}
                      >거절</button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}
