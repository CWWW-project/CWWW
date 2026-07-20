import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { minihompyApi } from '../../api/minihompy'
import type { MinihompyMainResponse, VisitorLogResponse } from '../../types'
import { useAuthStore } from '../../store/authStore'
import { useMinihompyStore } from '../../store/minihompyStore'
import { parseMood } from '../../utils/mood'

function formatTime(iso: string): string {
  const d = new Date(iso)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${mm}.${dd} ${hh}:${min}`
}

export default function VisitorPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { userId } = useParams<{ userId: string }>()
  const isMe = userId === 'me'
  const { clearAuth } = useAuthStore()
  const { main, setMain, clearMain } = useMinihompyStore()

  const [pageLoading, setPageLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [visitors, setVisitors] = useState<VisitorLogResponse[]>([])
  const [visitorsLoading, setVisitorsLoading] = useState(false)

  // 미니홈피 프로필 조회
  useEffect(() => {
    setPageLoading(true)
    setPageError('')
    let ignore = false

    const fetchMain = isMe
      ? minihompyApi.getMyMinihompy()
      : minihompyApi.getMinihompyMain(Number(userId))

    fetchMain
      .then(res => { if (!ignore) setMain(res.data.data) })
      .catch(e => { if (!ignore) setPageError(e.response?.data?.message ?? '미니홈피를 불러올 수 없습니다.') })
      .finally(() => { if (!ignore) setPageLoading(false) })

    return () => { ignore = true }
  }, [userId, isMe])

  // 방문자 목록 조회 — 본인일 때만
  useEffect(() => {
    if (!isMe) return
    setVisitorsLoading(true)
    minihompyApi.getRecentVisitors()
      .then(res => setVisitors(res.data.data))
      .catch(err => console.error('방문자 목록 조회 실패', err))
      .finally(() => setVisitorsLoading(false))
  }, [isMe])

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

  if (!isMe) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <p className="font-[Geist,monospace] text-[14px] text-[#5a4136]">방문자 목록은 본인만 볼 수 있어요.</p>
        <button className="retro-btn px-4 py-2" onClick={() => navigate(`/home/${userId}`)}>돌아가기</button>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-[#1a1c1c] py-6 flex justify-center items-start">
      <div className="max-w-[1024px] w-full mx-auto flex gap-0 relative z-10 px-2 md:px-0">
        <div className="window-frame p-4 w-full flex flex-col md:flex-row gap-4 border border-[#8e7164] relative">

          {/* 왼쪽 사이드바 — 다른 페이지와 동일 구조 */}
          <aside className="w-full md:w-64 flex-shrink-0 flex flex-col gap-2">
            <div className="text-center font-[Geist,monospace] text-[12px] font-semibold text-[#a33e00] bg-[#baeaff] py-2 window-inset">
              TODAY <span className="text-[#ba1a1a]">{main.visitorCount.today}</span> | TOTAL {main.visitorCount.total.toLocaleString()}
            </div>

            <div className="window-inset p-2 flex flex-col items-center gap-2">
              <div className="w-full aspect-square border border-[#8e7164] bg-[#eeeeee] overflow-hidden flex items-center justify-center">
                {main.profileImageUrl ? (
                  <img src={main.profileImageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-[80px] text-[#a33e00]" style={{ fontVariationSettings: "'FILL' 1" }}>face</span>
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
                  onClick={() => navigate('/home/me')}>
                  <span className="material-symbols-outlined text-base">home</span> 내 홈피 가기
                </button>
                <button className="retro-btn font-[Geist,monospace] text-[12px] font-semibold py-2 px-4 flex items-center justify-center gap-1 text-[#ba1a1a]"
                  onClick={() => { clearAuth(); clearMain(); navigate('/auth/login') }}>
                  <span className="material-symbols-outlined text-base">logout</span> 로그아웃
                </button>
              </div>
            </div>
          </aside>

          {/* 메인 콘텐츠 — 방문자 목록 */}
          <main className="flex-1 flex flex-col gap-2 min-w-0">
            <div className="window-frame p-1 bg-[#eeeeee] flex items-center justify-between">
              <div className="font-[Geist,monospace] text-[12px] font-bold text-[#1a1c1c]">{main.nickname}님의 미니홈피</div>
            </div>

            <div className="window-inset border border-[#8e7164] flex-1 flex flex-col bg-white">
              <div className="bg-[#e2e2e2] px-2 py-1 border-b border-[#8e7164] font-[Geist,monospace] text-[12px] font-semibold text-[#1a1c1c] flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">footprint</span>
                최근 방문자
              </div>
              <div className="flex flex-col overflow-y-auto" style={{ maxHeight: 520 }}>
                {visitorsLoading && (
                  <div className="p-8 text-center font-[Geist,monospace] text-[12px] text-[#5a4136]">불러오는 중...</div>
                )}
                {!visitorsLoading && visitors.length === 0 && (
                  <div className="p-8 text-center font-[Geist,monospace] text-[12px] text-[#5a4136]">
                    아직 방문자가 없어요.
                  </div>
                )}
                {visitors.map((v, idx) => (
                  <div key={idx} className={`p-2 flex items-center gap-2${idx < visitors.length - 1 ? ' border-b border-[#e3bfb1]' : ''}`}>
                    <div className="w-8 h-8 flex-shrink-0 border border-[#8e7164] bg-[#eeeeee] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[22px] text-[#a33e00]" style={{ fontVariationSettings: "'FILL' 1" }}>face</span>
                    </div>
                    <span className="font-[Geist,monospace] text-[12px] font-bold text-[#a33e00] flex-1">{v.nickname}</span>
                    <span className="font-[Geist,monospace] text-[10px] text-[#5a4136]">{formatTime(v.visitedAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>

        {/* 우측 탭 */}
        <nav className="hidden md:flex flex-col gap-1 w-16 pt-12 relative -ml-[2px] z-0">
          {[
            { icon: 'home', label: '홈', path: `/home/${userId}` },
            { icon: 'edit_note', label: '다이어리', path: `/diary/${userId}` },
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