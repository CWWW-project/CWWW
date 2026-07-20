import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { minihompyApi } from '../../api/minihompy'
import { guestbookApi } from '../../api/guestbook'
import type { MinihompyMainResponse, GuestbookResponse } from '../../types'
import { useAuthStore } from '../../store/authStore'
import { parseMood } from '../../utils/mood'
import { useMinihompyStore } from '../../store/minihompyStore'
import ProfileImageMenuModal from '../../components/ProfileImageMenuModal'


function formatTime(iso: string): string {
  const d = new Date(iso)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${mm}.${dd} ${hh}:${min}`
}

export default function GuestbookPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { userId } = useParams<{ userId: string }>()
  const isMe = userId === 'me'
  const { clearAuth } = useAuthStore()

  const {  main, setMain, clearMain } = useMinihompyStore()
  const [pageLoading, setPageLoading] = useState(true)
  const [pageError, setPageError] = useState('')

  const [entries, setEntries] = useState<GuestbookResponse[]>([])
  const [cursor, setCursor] = useState<number | undefined>(undefined)
  const [hasNext, setHasNext] = useState(false)
  const [loading, setLoading] = useState(false)

  const [writeContent, setWriteContent] = useState('')
  const [writeSecret, setWriteSecret] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editSecret, setEditSecret] = useState(false)

  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const profileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setPageLoading(true)
    setPageError('')
    let ignore = false

    const fetchMain = isMe
      ? minihompyApi.getMyMinihompy()
      : minihompyApi.getMinihompyMain(Number(userId))

    fetchMain
      .then(res => { if (!ignore) setMain(res.data.data) })
      .catch(e => { if (!ignore) setPageError(e.response?.data?.message ?? '방명록을 불러올 수 없습니다.') })
      .finally(() => { if (!ignore) setPageLoading(false) })

    return () => { ignore = true }
  }, [userId, isMe])

  const handleChangeProfile = () => {
    setShowProfileMenu(false)
    profileInputRef.current?.click()
  }

  const handleDeleteProfile = async () => {
    try {
      await minihompyApi.deleteProfileImage()
      const res = await minihompyApi.getMyMinihompy()
      setMain(res.data.data)
    } catch (e) {
      console.error('프로필 사진 삭제 실패', e)
      alert('프로필 사진 삭제에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setShowProfileMenu(false)
    }
  }

  const loadGuestbooks = (ownerId: number, cursorParam?: number) => {
    setLoading(true)
    guestbookApi.getList(ownerId, cursorParam)
      .then(res => {
        const { guestbooks, nextCursor, hasNext: more } = res.data.data
        setEntries(prev => cursorParam !== undefined ? [...prev, ...guestbooks] : guestbooks)
        setCursor(nextCursor ?? undefined)
        setHasNext(more)
      })
      .catch(() => {
        if (cursorParam === undefined) setEntries([])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!main) return
    loadGuestbooks(main.ownerId)
  }, [main?.ownerId])

  const submitGuestbook = async () => {
    if (!writeContent.trim() || submitting || !main) return
    setSubmitting(true)
    try {
      await guestbookApi.create(main.ownerId, { content: writeContent.trim(), isSecret: writeSecret })
      setWriteContent('')
      setWriteSecret(false)
      loadGuestbooks(main.ownerId)
    } catch (e) {
      console.error('방명록 작성 실패', e)
      alert('방명록 작성에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  const startEdit = (entry: GuestbookResponse) => {
    setEditingId(entry.guestbookId)
    setEditContent(entry.content ?? '')
    setEditSecret(entry.isSecret)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditContent('')
  }

  const submitEdit = async (guestbookId: number) => {
    if (!editContent.trim() || !main) return
    try {
      await guestbookApi.update(guestbookId, { content: editContent.trim(), isSecret: editSecret })
      setEditingId(null)
      loadGuestbooks(main.ownerId)
    } catch (e) {
      console.error('방명록 수정 실패', e)
      alert('방명록 수정에 실패했습니다. 다시 시도해주세요.')
    }
  }

  const removeGuestbook = async (guestbookId: number) => {
    if (!main) return
    try {
      await guestbookApi.delete(main.ownerId, guestbookId)
      setEntries(prev => prev.filter(e => e.guestbookId !== guestbookId))
    } catch (e) {
      console.error('방명록 삭제 실패', e)
      alert('방명록 삭제에 실패했습니다. 다시 시도해주세요.')
    }
  }

  const { emoji: moodEmoji, text: moodText } = parseMood(main?.mood)

  if (pageLoading) {
    return <div className="min-h-screen flex items-center justify-center font-[Geist,monospace] text-[13px] text-[#5a4136]">불러오는 중...</div>
  }

  if (pageError || !main) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <p className="font-[Geist,monospace] text-[14px] text-[#5a4136]">{pageError || '미니홈피를 찾을 수 없습니다.'}</p>
        <button className="retro-btn px-4 py-2" onClick={() => navigate('/')}>홈으로</button>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-[#1a1c1c] py-6 flex justify-center items-start">
        {showProfileMenu && main.owner && (
          <ProfileImageMenuModal
            onClose={() => setShowProfileMenu(false)}
            onChange={handleChangeProfile}
            onDelete={handleDeleteProfile}
          />
        )}
      <div className="max-w-[1024px] w-full mx-auto flex gap-0 relative z-10 px-2 md:px-0">
        <div className="window-frame p-4 w-full flex flex-col md:flex-row gap-4 border border-[#8e7164] relative">

          {/* 왼쪽 사이드바 — 그대로 유지 */}
          <aside className="w-full md:w-64 flex-shrink-0 flex flex-col gap-2">
            <div className="text-center font-[Geist,monospace] text-[12px] font-semibold text-[#a33e00] bg-[#baeaff] py-2 window-inset">
              TODAY <span className="text-[#ba1a1a]">{main.visitorCount.today}</span> | TOTAL {main.visitorCount.total.toLocaleString()}
            </div>

            <div className="window-inset p-2 flex flex-col items-center gap-2">
            <div
              className="w-full aspect-square border border-[#8e7164] bg-[#eeeeee] overflow-hidden flex items-center justify-center"
              style={main.owner ? { cursor: 'pointer' } : {}}
              onClick={() => { if (main.owner) setShowProfileMenu(true) }}
            >
              {main.profileImageUrl ? (
                <img src={main.profileImageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-[80px] text-[#a33e00]" style={{ fontVariationSettings: "'FILL' 1" }}>face</span>
              )}
              {main.owner && (
                <input
                  ref={profileInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return

                    try {
                      await minihompyApi.uploadProfileImage(file)
                      const res = await minihompyApi.getMyMinihompy()
                      setMain(res.data.data)
                    } catch (err) {
                      console.error('프로필 사진 업로드 실패', err)
                      alert('프로필 사진 업로드에 실패했습니다. 다시 시도해주세요.')
                    } finally {
                      e.target.value = ''
                    }
                  }}
                />
              )}
            </div>
              <div className="w-full text-center">
                <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[20px] font-bold text-[#a33e00] mb-1">{main.title}</h2>
                <p className="text-[13px] font-semibold text-[#5a4136] bg-[#eeeeee] border-2 border-[#c9c9c9] rounded-lg p-3 min-h-[40px] flex items-center justify-center text-center">
                  {main.introduction || '소개글이 없습니다'}
                </p>
              </div>
              <div className="flex items-center gap-1 font-[Geist,monospace] text-[12px] font-semibold text-[#5a4136] w-full bg-[#f9f9f9] py-1 px-2 window-inset">
                <span className="text-sm">{moodEmoji}</span>
                오늘의 기분: {moodText || '알 수 없음'}
              </div>

              <div className="flex flex-col gap-1 w-full mt-auto">
                <button className="retro-btn retro-btn-primary font-[Geist,monospace] text-[12px] font-semibold py-2 px-4 flex items-center justify-center gap-1"
                  onClick={() => navigate('/')}>
                  <span className="material-symbols-outlined text-base">home</span> 내 홈피 가기
                </button>
                <button className="retro-btn font-[Geist,monospace] text-[12px] font-semibold py-2 px-4 flex items-center justify-center gap-1 text-[#ba1a1a]"
                  onClick={() => { clearAuth(); clearMain(); navigate('/auth/login') }}>
                  <span className="material-symbols-outlined text-base">logout</span> 로그아웃
                </button>
              </div>
            </div>
          </aside>

          {/* 메인 콘텐츠 — BGM 헤더만 남기고 나머지 전부 방명록 */}
          <main className="flex-1 flex flex-col gap-2 min-w-0">

            {/* 방명록 작성 */}
            <div className="window-inset border border-[#8e7164] bg-white p-2 flex flex-col gap-2">
              <div className="flex gap-2">
                <div className="w-8 h-8 flex-shrink-0 border border-[#8e7164] bg-[#eeeeee] overflow-hidden flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl text-[#a33e00]" style={{ fontVariationSettings: "'FILL' 1" }}>face</span>
                </div>
                <textarea
                  className="window-inset flex-1 text-[13px] p-2 focus:outline-none resize-none"
                  rows={2}
                  placeholder="방명록을 남겨주세요..."
                  value={writeContent}
                  onChange={(e) => setWriteContent(e.target.value)}
                  maxLength={500}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1 font-[Geist,monospace] text-[11px] text-[#5a4136] cursor-pointer">
                  <input type="checkbox" checked={writeSecret} onChange={(e) => setWriteSecret(e.target.checked)} />
                  비밀글로 남기기
                </label>
                <button
                  className="retro-btn retro-btn-primary font-[Geist,monospace] text-[12px] font-semibold px-3 py-1"
                  onClick={submitGuestbook}
                  disabled={submitting || !writeContent.trim()}
                >
                  {submitting ? '남기는 중...' : '남기기'}
                </button>
              </div>
            </div>

            {/* 방명록 목록 — 남은 공간 전부 차지 */}
            <div className="window-inset border border-[#8e7164] flex-1 flex flex-col bg-white">
              <div className="bg-[#e2e2e2] px-2 py-1 border-b border-[#8e7164] font-[Geist,monospace] text-[12px] font-semibold text-[#1a1c1c] flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">forum</span>
                방명록
              </div>
              <div className="flex flex-col overflow-y-auto" style={{ maxHeight: 640 }}>
                {entries.length === 0 && !loading && (
                  <div className="p-8 text-center font-[Geist,monospace] text-[12px] text-[#5a4136]">
                    아직 방명록이 없어요. 첫 방명록을 남겨보세요!
                  </div>
                )}

                {entries.map((entry, idx) => (
                  <div key={entry.guestbookId} className={`p-2 flex gap-2${idx < entries.length - 1 ? ' border-b border-[#e3bfb1]' : ''}`}>
                    <div className="w-8 h-8 flex-shrink-0 border border-[#8e7164] bg-[#eeeeee] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[22px] text-[#a33e00]" style={{ fontVariationSettings: "'FILL' 1" }}>face</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-[Geist,monospace] text-[12px] font-bold text-[#a33e00]">{entry.writerNickname}</span>
                        {entry.isSecret && (
                          <span className="material-symbols-outlined text-[13px] text-[#5a4136]" title="비밀글">lock</span>
                        )}
                        <span className="font-[Geist,monospace] text-[10px] text-[#5a4136]">{formatTime(entry.createdAt)}</span>
                      </div>

                      {editingId === entry.guestbookId ? (
                        <div className="flex flex-col gap-1">
                          <textarea
                            className="window-inset w-full text-[13px] p-1 focus:outline-none resize-none"
                            rows={2}
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            maxLength={500}
                          />
                          <div className="flex items-center justify-between">
                            <label className="flex items-center gap-1 font-[Geist,monospace] text-[11px] text-[#5a4136] cursor-pointer">
                              <input type="checkbox" checked={editSecret} onChange={(e) => setEditSecret(e.target.checked)} />
                              비밀글
                            </label>
                            <div className="flex gap-1">
                              <button className="retro-btn font-[Geist,monospace] text-[11px] px-2 py-1" onClick={cancelEdit}>취소</button>
                              <button className="retro-btn retro-btn-primary font-[Geist,monospace] text-[11px] px-2 py-1" onClick={() => submitEdit(entry.guestbookId)}>저장</button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-[13px] text-[#1a1c1c]">
                            {entry.visible ? entry.content : <span className="text-[#5a4136] italic">비밀글입니다</span>}
                          </p>
                          {(entry.canEdit || entry.canDelete) && (
                            <div className="flex gap-2 mt-1">
                              {entry.canEdit && (
                                <button className="font-[Geist,monospace] text-[10px] text-[#5a4136] hover:underline" onClick={() => startEdit(entry)}>수정</button>
                              )}
                              {entry.canDelete && (
                                <button className="font-[Geist,monospace] text-[10px] text-[#ba1a1a] hover:underline" onClick={() => removeGuestbook(entry.guestbookId)}>삭제</button>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}

                <div className="p-2 flex justify-center border-t border-[#e3bfb1]">
                  {hasNext ? (
                    <button className="retro-btn font-[Geist,monospace] text-[12px] font-semibold px-12 py-2 flex items-center gap-1"
                      onClick={() => loadGuestbooks(main.ownerId, cursor)} disabled={loading}>
                      <span className="material-symbols-outlined text-base">{loading ? 'hourglass_empty' : 'expand_more'}</span>
                      {loading ? '로딩 중...' : '더 보기'}
                    </button>
                  ) : (loading && <span className="font-[Geist,monospace] text-[12px] text-[#5a4136]">로딩 중...</span>)}
                </div>
              </div>
            </div>
          </main>
        </div>

        {/* 우측 탭 */}
        <nav className="hidden md:flex flex-col gap-1 w-16 pt-12 relative -ml-[2px] z-0">
          {[
            { icon: 'home', label: '홈', path: '/' },
            { icon: 'edit_note', label: '다이어리', path: `/diary/${userId}` },
            { icon: 'photo_library', label: '사진첩', path: `/photo/${userId}` },
            { icon: 'forum', label: '방명록', path: `/guestbook/${userId}` },
            { icon: 'footprint', label: '방문자', path: `/visitor/${userId}` },
            { icon: 'storefront', label: '상점', path: '/shop' },
          ].map(tab => {
            const active = location.pathname === tab.path
            return (
              <button key={tab.label} onClick={() => navigate(tab.path)}
                className={`tab-item${active ? ' tab-active' : ' bg-[#f3f3f3] text-[#5a4136] hover:bg-[#e2e2e2]'} py-2 px-1 text-center font-[Geist,monospace] text-[12px] font-semibold flex flex-col items-center gap-1 cursor-pointer border-none`}>
                <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}