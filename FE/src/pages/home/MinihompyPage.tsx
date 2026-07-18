import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { minihompyApi } from '../../api/minihompy'
import type { MinihompyMainResponse } from '../../types'

type Tab = '다이어리' | '사진첩' | '방명록' | '일촌'

interface DiaryPost {
  id: number
  date: string
  title: string
  content: string
  mood: string
  weather: string
  likes: number
  comments: number
}

const DIARY_POSTS: DiaryPost[] = [
  { id: 1, date: '2024.07.10', title: '오늘 홈피 꾸며봤다 ☺️', content: '드디어 미니룸 꾸미기 완성! 소파랑 TV 배치가 마음에 든다. 친구들 놀러오면 좋겠다 ㅎㅎ', mood: '😊', weather: '☀️', likes: 12, comments: 3 },
  { id: 2, date: '2024.07.09', title: '카페에서 코딩한 날', content: '스프링부트 공부하다 머리 터질 뻔ㅠ 근데 결국 해냈다! JWT 구현 완료 🎉', mood: '😤', weather: '⛅', likes: 8, comments: 2 },
  { id: 3, date: '2024.07.08', title: '오랜만에 친구들 만남', content: '오늘 동아리 친구들이랑 노래방 갔다왔다. 진짜 오랜만에 스트레스 확 풀렸어!', mood: '😆', weather: '🌤️', likes: 24, comments: 7 },
]

const GUESTBOOK = [
  { id: 1, author: '윤주원', time: '10분 전', message: '홈피 너무 예쁘다!! 미니룸 어디서 샀어? 나도 저 소파 사고 싶다 ㅠ', icon: '#a33e00' },
  { id: 2, author: '김찬호', time: '어제', message: '들어왔다가요~ 요즘 잘 지내? 나중에 같이 카페가자 ☕', icon: '#0c6780' },
  { id: 3, author: '장수호', time: '2일 전', message: '오 블로그 글 잘 읽었어! 도움 많이 됐다 감사합니다 🙏', icon: '#388e3c' },
]

const PHOTOS = [
  { id: 1, label: '카페 작업샷', color: '#d6eaf8' },
  { id: 2, label: '친구들과', color: '#fce4ec' },
  { id: 3, label: '오늘 점심', color: '#e8f5e9' },
  { id: 4, label: '야경', color: '#ede7f6' },
  { id: 5, label: '산책길', color: '#fff8e1' },
  { id: 6, label: '고양이', color: '#e3f2fd' },
]

const ILCHON = [
  { name: '윤주원', status: '접속 중', color: '#0c6780' },
  { name: '김찬호', status: '1시간 전', color: '#5a4136' },
  { name: '장수호', status: '어제', color: '#5a4136' },
  { name: '김채린', status: '3일 전', color: '#5a4136' },
]

export default function MinihompyPage() {
  const navigate = useNavigate()
  const { userId } = useParams<{ userId: string }>()  // 'me' 또는 '123'
  const isMe = userId === 'me'
  const [main, setMain] = useState<MinihompyMainResponse | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('다이어리')
  const [guestInput, setGuestInput] = useState('')
  const [guestbook, setGuestbook] = useState(GUESTBOOK)

  useEffect(() => {
    const fetchMinihompy = isMe
      ? minihompyApi.getMyMinihompy()
      : minihompyApi.getMinihompyMain(Number(userId))
    fetchMinihompy
      .then(res => setMain(res.data.data))
      .catch(err => console.error('미니홈피 조회 실패', err))
  }, [userId, isMe])

  const submitGuest = () => {
    if (!guestInput.trim()) return
    setGuestbook(prev => [
      { id: Date.now(), author: '나', time: '방금', message: guestInput.trim(), icon: '#a33e00' },
      ...prev,
    ])
    setGuestInput('')
  }

  return (
    <div className="min-h-screen text-[#1a1c1c] py-6 flex justify-center items-start">
      <div className="max-w-[1024px] w-full mx-auto flex gap-0 relative z-10 px-2 md:px-0">
        <div className="window-frame p-0 w-full flex flex-col border border-[#8e7164] relative overflow-hidden">

          {/* 타이틀바 */}
          <div className="retro-title-bar">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
            김채린의 미니홈피
            <div className="ml-auto flex gap-1">
              <div className="title-btn">_</div>
              <div className="title-btn">□</div>
              <div className="title-btn" onClick={() => navigate('/')}>✕</div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row">

            {/* 왼쪽 프로필 */}
            <aside className="w-full md:w-56 flex-shrink-0 flex flex-col border-r border-[#8e7164]">

              {/* 미니룸 썸네일 */}
              <div className="relative" style={{ height: 160, background: 'linear-gradient(to bottom, #d6eaf8 60%, #c4a882)', overflow: 'hidden', cursor: 'pointer' }}
                onClick={() => navigate('/room')}>
                {/* 소파 */}
                <div className="absolute" style={{ left: '50%', bottom: '42%', transform: 'translateX(-50%)' }}>
                  <div style={{ width: 70, height: 18, background: '#5d4037', border: '2px solid #4e342e', borderRadius: '4px 4px 0 0' }} />
                  <div style={{ width: 70, height: 12, background: '#795548', border: '2px solid #4e342e' }} />
                  <div style={{ position: 'absolute', top: 0, left: -6, width: 6, height: 24, background: '#4e342e' }} />
                  <div style={{ position: 'absolute', top: 0, right: -6, width: 6, height: 24, background: '#4e342e' }} />
                </div>
                {/* 미니미 */}
                <div className="absolute flex flex-col items-center" style={{ left: '50%', bottom: '42%', transform: 'translateX(-50%) translateX(-40px)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 36, fontVariationSettings: "'FILL' 1", color: '#a33e00' }}>face</span>
                  <div style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid #ccc', padding: '1px 5px', fontSize: 8, fontFamily: 'Geist, monospace', whiteSpace: 'nowrap' }}>김채린</div>
                </div>
                {/* 꾸미기 오버레이 */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity" style={{ background: 'rgba(0,0,0,0.3)' }}>
                  <span className="font-[Geist,monospace] text-[12px] font-bold text-white">미니룸 꾸미기</span>
                </div>
              </div>

              {/* 프로필 정보 */}
              <div className="p-3 flex flex-col gap-2 border-b border-[#e3bfb1]">
                <div className="text-center">
                  <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[20px] font-bold text-[#a33e00]">{main?.nickname}</h2>
                  <p className="font-[Geist,monospace] text-[10px] text-[#5a4136] mt-1">HOME 도메인 담당</p>
                </div>
                <div className="window-inset p-2 text-[13px] text-[#1a1c1c] text-center min-h-[48px] flex items-center justify-center">
                  사진 찍는 걸 좋아해요 📷<br />친구들 놀러오세요~
                </div>
                <div className="flex items-center gap-1 window-inset px-2 py-1">
                  <span className="material-symbols-outlined text-[#a33e00] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>sentiment_satisfied</span>
                  <span className="font-[Geist,monospace] text-[12px] text-[#5a4136]">기분: 설렘</span>
                </div>
              </div>

              {/* 방문자 카운터 */}
              <div className="p-2 border-b border-[#e3bfb1] window-inset text-center">
                <div className="font-[Geist,monospace] text-[12px] font-semibold text-[#1a1c1c]">
                  TODAY <span className="text-[#ba1a1a] font-bold">87</span> &nbsp;|&nbsp; TOTAL <span className="font-bold">23,456</span>
                </div>
              </div>

              {/* 일촌 목록 */}
              <div className="flex flex-col border-b border-[#e3bfb1]">
                <div className="bg-[#e2e2e2] px-2 py-1 font-[Geist,monospace] text-[12px] font-semibold text-[#1a1c1c] flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">group</span>
                  일촌 <span className="ml-auto text-[#a33e00]">{ILCHON.length}명</span>
                </div>
                <div className="p-2 flex flex-col gap-1">
                  {ILCHON.map(f => (
                    <div key={f.name} className="flex items-center gap-2 cursor-pointer hover:bg-[#eeeeee] p-1 rounded">
                      <div className="w-6 h-6 border border-[#8e7164] bg-[#eeeeee] flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1", color: f.color }}>face</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-[Geist,monospace] text-[12px] font-semibold text-[#1a1c1c] truncate">{f.name}</p>
                        <p className="text-[10px]" style={{ color: f.status === '접속 중' ? '#0c6780' : '#5a4136' }}>● {f.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* BGM */}
              <div className="p-2">
                <div className="window-inset flex items-center gap-1 px-2 py-1">
                  <span className="material-symbols-outlined text-sm text-[#a33e00]">music_note</span>
                  <div className="flex-1 overflow-hidden">
                    <span className="font-[Geist,monospace] text-[11px] text-[#5a4136] whitespace-nowrap" style={{ display: 'inline-block' }}>
                      IU - 밤편지
                    </span>
                  </div>
                  <button className="retro-btn p-1"><span className="material-symbols-outlined text-[11px]">play_arrow</span></button>
                </div>
              </div>
            </aside>

            {/* 오른쪽 콘텐츠 */}
            <div className="flex-1 flex flex-col min-w-0">

              {/* 탭 */}
              <div className="flex border-b border-[#8e7164] bg-[#e2e2e2]">
                {(['다이어리', '사진첩', '방명록', '일촌'] as Tab[]).map(tab => (
                  <button
                    key={tab}
                    className={`font-[Geist,monospace] text-[12px] font-semibold px-4 py-2 border-r border-[#8e7164] transition-colors${activeTab === tab ? ' bg-[#f9f9f9] text-[#a33e00] border-b-2 border-b-[#f9f9f9] -mb-px' : ' text-[#5a4136] hover:bg-[#eeeeee]'}`}
                    onClick={() => setActiveTab(tab)}
                  >{tab}</button>
                ))}
              </div>

              {/* 탭 콘텐츠 */}
              <div className="p-3 flex-1 overflow-y-auto" style={{ minHeight: 400 }}>

                {/* 다이어리 */}
                {activeTab === '다이어리' && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-['Bricolage_Grotesque',sans-serif] text-[20px] font-bold text-[#1a1c1c]">다이어리</h3>
                      <button className="retro-btn retro-btn-primary font-[Geist,monospace] text-[12px] font-semibold px-2 py-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">edit</span> 쓰기
                      </button>
                    </div>
                    {DIARY_POSTS.map(post => (
                      <div key={post.id} className="window-frame p-3 flex flex-col gap-2 cursor-pointer hover:bg-[#fffbe8]">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{post.mood}</span>
                          <span className="text-lg">{post.weather}</span>
                          <span className="font-[Geist,monospace] text-[11px] text-[#5a4136] ml-auto">{post.date}</span>
                        </div>
                        <h4 className="font-['Bricolage_Grotesque',sans-serif] text-[16px] font-bold text-[#1a1c1c]">{post.title}</h4>
                        <p className="text-[14px] text-[#5a4136] leading-relaxed">{post.content}</p>
                        <div className="flex gap-2 pt-1 border-t border-[#e3bfb1]">
                          <button className="retro-btn font-[Geist,monospace] text-[11px] font-semibold px-2 py-1 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 0" }}>favorite</span>
                            {post.likes}
                          </button>
                          <button className="retro-btn font-[Geist,monospace] text-[11px] font-semibold px-2 py-1 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">chat_bubble</span>
                            {post.comments}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 사진첩 */}
                {activeTab === '사진첩' && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-['Bricolage_Grotesque',sans-serif] text-[20px] font-bold text-[#1a1c1c]">사진첩</h3>
                      <button className="retro-btn retro-btn-primary font-[Geist,monospace] text-[12px] font-semibold px-2 py-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">add_photo_alternate</span> 업로드
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {PHOTOS.map(photo => (
                        <div key={photo.id} className="window-frame cursor-pointer overflow-hidden group">
                          <div className="aspect-square flex items-center justify-center relative" style={{ background: photo.color }}>
                            <span className="material-symbols-outlined text-[48px] text-[#8e7164] group-hover:scale-110 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>image</span>
                            <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity" />
                          </div>
                          <div className="p-1 font-[Geist,monospace] text-[11px] text-[#5a4136] text-center border-t border-[#e3bfb1]">{photo.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 방명록 */}
                {activeTab === '방명록' && (
                  <div className="flex flex-col gap-3">
                    <h3 className="font-['Bricolage_Grotesque',sans-serif] text-[20px] font-bold text-[#1a1c1c] mb-1">방명록</h3>

                    {/* 글쓰기 */}
                    <div className="window-inset p-2 flex gap-2">
                      <div className="w-8 h-8 flex-shrink-0 border border-[#8e7164] bg-[#eeeeee] flex items-center justify-center">
                        <span className="material-symbols-outlined text-[22px] text-[#a33e00]" style={{ fontVariationSettings: "'FILL' 1" }}>face</span>
                      </div>
                      <div className="flex-1 flex flex-col gap-1">
                        <textarea
                          className="window-inset w-full text-[13px] p-1 focus:outline-none resize-none"
                          rows={2}
                          placeholder="방명록을 남겨주세요..."
                          value={guestInput}
                          onChange={(e) => setGuestInput(e.target.value)}
                        />
                        <div className="flex justify-end">
                          <button className="retro-btn retro-btn-primary font-[Geist,monospace] text-[12px] font-semibold px-3 py-1" onClick={submitGuest}>남기기</button>
                        </div>
                      </div>
                    </div>

                    {/* 방명록 목록 */}
                    <div className="flex flex-col gap-2">
                      {guestbook.map(entry => (
                        <div key={entry.id} className="window-frame p-2 flex gap-2">
                          <div className="w-8 h-8 flex-shrink-0 border border-[#8e7164] bg-[#eeeeee] flex items-center justify-center">
                            <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1", color: entry.icon }}>face</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-[Geist,monospace] text-[12px] font-bold text-[#a33e00]">{entry.author}</span>
                              <span className="font-[Geist,monospace] text-[10px] text-[#5a4136]">{entry.time}</span>
                            </div>
                            <p className="text-[13px] text-[#1a1c1c]">{entry.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 일촌 */}
                {activeTab === '일촌' && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-['Bricolage_Grotesque',sans-serif] text-[20px] font-bold text-[#1a1c1c]">일촌 목록</h3>
                      <button className="retro-btn retro-btn-primary font-[Geist,monospace] text-[12px] font-semibold px-2 py-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">person_add</span> 일촌 신청
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {ILCHON.map(f => (
                        <div key={f.name} className="window-frame p-3 flex flex-col items-center gap-2 cursor-pointer hover:bg-[#fffbe8]">
                          <div className="w-14 h-14 border-2 border-[#8e7164] bg-[#eeeeee] flex items-center justify-center">
                            <span className="material-symbols-outlined text-[40px]" style={{ fontVariationSettings: "'FILL' 1", color: '#a33e00' }}>face</span>
                          </div>
                          <div className="text-center">
                            <p className="font-[Geist,monospace] text-[12px] font-bold text-[#1a1c1c]">{f.name}</p>
                            <p className="text-[10px]" style={{ color: f.status === '접속 중' ? '#0c6780' : '#5a4136' }}>● {f.status}</p>
                          </div>
                          <button className="retro-btn font-[Geist,monospace] text-[10px] font-semibold px-2 py-1 w-full text-center">홈피 가기</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 푸터 */}
          <div className="p-2 border-t border-[#e3bfb1] text-center font-[Geist,monospace] text-[11px] text-[#5a4136]">
            담당: 김채린 · HOME 도메인 · 미니홈피 / 다이어리 / 사진첩 / 방명록
          </div>
        </div>

        {/* 우측 탭 */}
        <nav className="hidden md:flex flex-col gap-1 w-16 pt-12 relative -ml-[2px] z-0">
          {[
            { icon: 'home', label: '홈', active: true },
            { icon: 'edit_note', label: '다이어리' },
            { icon: 'photo_library', label: '사진첩' },
            { icon: 'forum', label: '방명록' },
            { icon: 'storefront', label: '상점' },
          ].map(tab => (
            <div key={tab.label}
              className={`tab-item${tab.active ? ' tab-active' : ' bg-[#f3f3f3] text-[#5a4136] hover:bg-[#e2e2e2]'} py-2 px-1 text-center font-[Geist,monospace] text-[12px] font-semibold flex flex-col items-center gap-1`}>
              <span className="material-symbols-outlined text-lg">{tab.icon}</span>
              {tab.label}
            </div>
          ))}
        </nav>
      </div>
    </div>
  )
}
