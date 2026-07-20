import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { minihompyApi } from '../../api/minihompy'
import { guestbookApi } from '../../api/guestbook'
import type { GuestbookResponse } from '../../types'
import { parseMoodEmoji } from '../../utils/mood'
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
  const { userId } = useParams<{ userId: string }>()
  const isMe = userId === 'me'

  const { main, setMain } = useMinihompyStore()
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

  const moodEmoji = parseMoodEmoji(main?.mood)

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

      <div className="max-w-[720px] w-full mx-auto px-2">
        <div className="window-frame p-4 flex flex-col gap-3 border border-[#8e7164]">

          {/* 헤더 — 작은 프로필 + 이름 + 기분/소개 한 줄 */}
          <div className="flex items-center gap-3">
            <div
              className="w-14 h-14 flex-shrink-0 border border-[#8e7164] bg-[#eeeeee] overflow-hidden flex items-center justify-center relative"
              style={main.owner ? { cursor: 'pointer' } : {}}
              onClick={() => { if (main.owner) setShowProfileMenu(true) }}
            >
              {main.profileImageUrl ? (
                <img src={main.profileImageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-[36px] text-[#a33e00]" style={{ fontVariationSettings: "'FILL' 1" }}>face</span>
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

            <div className="flex-1 min-w-0">
              <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[18px] font-bold text-[#a33e00]">{main.title}</h2>
              <p className="font-[Geist,monospace] text-[11px] text-[#5a4136] truncate">
                {main.introduction || '소개글이 없습니다'}
              </p>
            </div>

            {main.owner ? (
              <span
                className="retro-btn font-[Geist,monospace] text-[12px] font-semibold px-2 py-1 flex items-center gap-1 flex-shrink-0">
                {moodEmoji || '❓'}
              </span>
            ) : (
              <span className="font-[Geist,monospace] text-[16px] flex-shrink-0">{moodEmoji || '❓'}</span>
            )}
          </div>

          <div className="flex items-center justify-between font-[Geist,monospace] text-[11px] font-semibold text-[#a33e00]">
            <span>TODAY <span className="text-[#ba1a1a]">{main.visitorCount.today}</span> | TOTAL {main.visitorCount.total.toLocaleString()}</span>
            <div className="flex gap-1">
              <button
                className="retro-btn font-[Geist,monospace] text-[11px] font-semibold px-2 py-1"
                onClick={() => navigate('/')}
              >
                내 홈피
              </button>
            </div>
          </div>

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

          {/* 방명록 목록 */}
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
                <div key={entry.guestbookId} className={`flex flex-col${idx < entries.length - 1 ? ' border-b border-[#e3bfb1]' : ''}`}>
                  {/* 상단 바 — 번호 + 닉네임 + 날짜 */}
                  <div className="bg-[#f3f3f3] px-3 py-1.5 flex items-center gap-2 border-b border-[#e3bfb1]">
                    <span className="font-[Geist,monospace] text-[11px] text-[#8e7164]">NO.{entry.guestbookId}</span>
                    <span className="font-[Geist,monospace] text-[12px] font-bold text-[#a33e00]">{entry.writerNickname}</span>
                    {entry.isSecret && (
                      <span
                        className="material-symbols-outlined text-[#5a4136]"
                        style={{ fontSize: '16px' }}
                        title="비밀글"
                      >
                        lock
                      </span>
                    )}
                    <span className="font-[Geist,monospace] text-[10px] text-[#5a4136] ml-auto">{formatTime(entry.createdAt)}</span>
                  </div>

                  {/* 본문 — 프로필 사진 + 내용 */}
                  <div className="p-5 flex gap-5">
                    <div className="w-28 h-32 flex-shrink-0 border border-[#8e7164] bg-[#eeeeee] overflow-hidden flex items-center justify-center">
                      {entry.writerProfileImageUrl ? (
                        <img src={entry.writerProfileImageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-[40px] text-[#a33e00]" style={{ fontVariationSettings: "'FILL' 1" }}>face</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
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
                          <p className="text-[14px] text-[#1a1c1c] whitespace-pre-wrap leading-relaxed">
                            {entry.visible ? entry.content : <span className="text-[#5a4136] italic">비밀글입니다</span>}
                          </p>
                          {(entry.canEdit || entry.canDelete) && (
                            <div className="flex justify-end gap-2 mt-1">
                              {entry.canEdit && (
                                <button className="font-[Geist,monospace] text-[11px] text-[#5a4136] hover:underline" onClick={() => startEdit(entry)}>수정</button>
                              )}
                              {entry.canDelete && (
                                <button className="font-[Geist,monospace] text-[11px] text-[#ba1a1a] hover:underline" onClick={() => removeGuestbook(entry.guestbookId)}>삭제</button>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
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

          <button className="retro-btn font-[Geist,monospace] text-[12px] font-semibold px-3 py-2 self-start" onClick={() => navigate(-1)}>
            <span className="material-symbols-outlined text-sm align-middle">arrow_back</span> 뒤로가기
          </button>
        </div>
      </div>
    </div>
  )
}