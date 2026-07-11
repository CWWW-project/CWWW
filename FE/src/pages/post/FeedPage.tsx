import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { postApi } from '../../api/post'
import type { PostResponse } from '../../types'
import { useAuthStore } from '../../store/authStore'

function formatTime(iso: string): string {
  const d = new Date(iso)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${mm}.${dd} ${hh}:${min}`
}

const ONLINE_FRIENDS = [
  { name: '윤주원', status: '접속 중', color: 'text-[#0c6780]' },
  { name: '김채린', status: '5분 전', color: 'text-[#0c6780]' },
  { name: '김찬호', status: '20분 전', color: 'text-[#5a4136]' },
]

export default function FeedPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [posts, setPosts] = useState<PostResponse[]>([])
  const [cursor, setCursor] = useState<number | undefined>(undefined)
  const [hasNext, setHasNext] = useState(false)
  const [loading, setLoading] = useState(false)
  const [likedPostIds, setLikedPostIds] = useState<Set<number>>(new Set())
  const [pendingLikeIds, setPendingLikeIds] = useState<Set<number>>(new Set())
  const [filter, setFilter] = useState<'전체' | '일촌만' | '사진만'>('전체')
  const [newPost, setNewPost] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({})

  const loadFeed = useCallback(async (cursorParam?: number) => {
    setLoading(true)
    try {
      const res = await postApi.getFeed(cursorParam)
      const { posts: newPosts, nextCursor, hasNext: more } = res.data.data
      setPosts(prev => cursorParam !== undefined ? [...prev, ...newPosts] : newPosts)
      setCursor(nextCursor ?? undefined)
      setHasNext(more)
    } catch (e) {
      console.error('피드 로드 실패', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadFeed()
  }, [loadFeed])

  const toggleLike = async (postId: number) => {
    if (pendingLikeIds.has(postId)) return
    const liked = likedPostIds.has(postId)

    setPendingLikeIds(prev => new Set(prev).add(postId))
    setLikedPostIds(prev => {
      const next = new Set(prev)
      liked ? next.delete(postId) : next.add(postId)
      return next
    })
    setPosts(prev => prev.map(p =>
      p.postId === postId ? { ...p, likeCount: liked ? p.likeCount - 1 : p.likeCount + 1 } : p
    ))
    try {
      if (liked) await postApi.unlikePost(postId)
      else await postApi.likePost(postId)
    } catch {
      setLikedPostIds(prev => {
        const next = new Set(prev)
        liked ? next.add(postId) : next.delete(postId)
        return next
      })
      setPosts(prev => prev.map(p =>
        p.postId === postId ? { ...p, likeCount: liked ? p.likeCount + 1 : p.likeCount - 1 } : p
      ))
    } finally {
      setPendingLikeIds(prev => {
        const next = new Set(prev)
        next.delete(postId)
        return next
      })
    }
  }

  const submitPost = async () => {
    if (!newPost.trim() || isSubmitting) return
    setIsSubmitting(true)
    try {
      const res = await postApi.createPost({
        title: '',
        content: newPost.trim(),
        visibility: 'ALL',
        hashtags: [],
        mediaUrls: [],
      })
      setPosts(prev => [res.data.data, ...prev])
      setNewPost('')
    } catch (e) {
      console.error('글 작성 실패', e)
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredPosts = posts.filter(p => {
    if (filter === '사진만') return p.mediaUrls.length > 0
    return true
  })

  return (
    <div className="min-h-screen text-[#1a1c1c] py-6 flex justify-center items-start">

      {/* 모바일 헤더 */}
      <header className="md:hidden flex justify-between items-center px-4 h-16 w-full fixed top-0 z-50 bg-[#f9f9f9] border-b-2 border-[#e3bfb1]" style={{ boxShadow: '2px 2px 0px rgba(0,0,0,0.1)' }}>
        <div className="font-['Bricolage_Grotesque',sans-serif] text-[28px] font-bold text-[#a33e00]">싸이월드</div>
        <div className="flex gap-2">
          <span className="material-symbols-outlined text-[#a33e00] cursor-pointer p-2">search</span>
          <span className="material-symbols-outlined text-[#a33e00] cursor-pointer p-2">notifications</span>
          <span className="material-symbols-outlined text-[#a33e00] cursor-pointer p-2">person</span>
        </div>
      </header>

      <div className="max-w-[1024px] w-full mx-auto mt-16 md:mt-0 flex gap-0 relative z-10 px-2 md:px-0">
        <div className="window-frame p-4 w-full flex flex-col md:flex-row gap-4 border border-[#8e7164] relative">

          {/* 왼쪽 사이드바 */}
          <aside className="w-full md:w-64 flex-shrink-0 flex flex-col gap-2">

            {/* TODAY/TOTAL */}
            <div className="text-center font-[Geist,monospace] text-[12px] font-semibold text-[#a33e00] bg-[#baeaff] py-2 window-inset">
              TODAY <span className="text-[#ba1a1a]">42</span> | TOTAL 12,345
            </div>

            {/* 내 프로필 */}
            <div className="window-inset p-2 flex flex-col items-center gap-2">
              <div className="w-full aspect-square border border-[#8e7164] bg-[#eeeeee] overflow-hidden flex items-center justify-center">
                <span className="material-symbols-outlined text-[80px] text-[#a33e00]" style={{ fontVariationSettings: "'FILL' 1" }}>face</span>
              </div>
              <div className="w-full text-center">
                <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[20px] font-bold text-[#a33e00] mb-1">
                  {user?.nickname ?? '내'}의 홈피
                </h2>
                <p className="text-[14px] text-[#5a4136] bg-[#eeeeee] p-1 window-inset min-h-[40px] flex items-center justify-center">
                  열심히 살자 💪
                </p>
              </div>
              <div className="flex items-center gap-1 font-[Geist,monospace] text-[12px] font-semibold text-[#5a4136] w-full bg-[#f9f9f9] py-1 px-2 window-inset">
                <span className="material-symbols-outlined text-[#a33e00] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>sentiment_satisfied</span>
                오늘의 기분: 맑음
              </div>
              <div className="flex flex-col gap-1 w-full mt-auto">
                <button className="retro-btn retro-btn-primary font-[Geist,monospace] text-[12px] font-semibold py-2 px-4 flex items-center justify-center gap-1"
                  onClick={() => navigate('/home/me')}>
                  <span className="material-symbols-outlined text-base">home</span> 내 홈피 가기
                </button>
                <button className="retro-btn font-[Geist,monospace] text-[12px] font-semibold py-2 px-4 flex items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-base">edit_note</span> 다이어리 쓰기
                </button>
              </div>
            </div>

            {/* 접속 중인 일촌 */}
            <div className="window-inset flex flex-col">
              <div className="bg-[#e2e2e2] px-2 py-1 border-b border-[#8e7164] font-[Geist,monospace] text-[12px] font-semibold text-[#1a1c1c] flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">group</span>
                접속 중인 일촌
                <span className="ml-auto bg-[#a33e00] text-white font-[Geist,monospace] text-[10px] px-1 rounded-full">3</span>
              </div>
              <div className="p-2 flex flex-col gap-1">
                {ONLINE_FRIENDS.map(f => (
                  <div key={f.name} className="flex items-center gap-2 cursor-pointer hover:bg-[#eeeeee] p-1 rounded">
                    <div className="w-7 h-7 border border-[#8e7164] bg-[#eeeeee] overflow-hidden flex-shrink-0 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px] text-[#a33e00]" style={{ fontVariationSettings: "'FILL' 1" }}>face</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-[Geist,monospace] text-[12px] font-semibold text-[#1a1c1c]">{f.name}</p>
                      <p className={`text-[10px] ${f.color}`}>● {f.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* 피드 */}
          <main className="flex-1 flex flex-col gap-2 min-w-0">

            {/* BGM 바 */}
            <div className="window-frame p-1 bg-[#eeeeee] flex items-center justify-between">
              <div className="font-[Geist,monospace] text-[12px] font-bold text-[#1a1c1c]">홈 피드</div>
              <div className="flex items-center gap-2 bg-[#f9f9f9] window-inset px-2 py-1">
                <span className="material-symbols-outlined text-sm text-[#a33e00]">music_note</span>
                <div className="w-36 overflow-hidden">
                  <span className="font-[Geist,monospace] text-[12px] text-[#5a4136] inline-block" style={{ animation: 'marquee 10s linear infinite', whiteSpace: 'nowrap' }}>
                    프리스타일 - Y (Please Tell Me Why)
                  </span>
                </div>
                <div className="flex gap-1">
                  <button className="retro-btn p-1"><span className="material-symbols-outlined text-[12px]">play_arrow</span></button>
                  <button className="retro-btn p-1"><span className="material-symbols-outlined text-[12px]">skip_next</span></button>
                </div>
              </div>
            </div>

            {/* 미니룸 프리뷰 */}
            <div className="window-inset border border-[#8e7164] overflow-hidden bg-white flex flex-col">
              <div className="bg-[#baeaff] px-2 py-1 border-b border-[#8e7164] font-[Geist,monospace] text-[12px] font-semibold text-[#09657f] flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">house</span>
                Miniroom
                <span className="text-[#5a4136] font-normal ml-1">· 프리스타일 - Y</span>
                <button className="retro-btn font-[Geist,monospace] text-[11px] font-semibold px-2 py-1 ml-auto flex items-center gap-1"
                  onClick={() => navigate('/room')}>
                  <span className="material-symbols-outlined text-[13px]">edit</span> 꾸미기
                </button>
              </div>
              <div className="relative w-full" style={{ height: 280, overflow: 'hidden' }}>
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, #c8e6f5 0%, #d9eff8 58%, #c4a882 58%, #b8976e 100%)' }} />
                <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(255,255,255,0.15) 40px)', height: '58%', top: 0 }} />
                <div className="absolute left-0 right-0" style={{ top: '58%', bottom: 0, backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 49px, rgba(0,0,0,0.08) 50px)' }} />
                <div className="absolute left-0 right-0" style={{ top: 'calc(58% - 1px)', height: 2, background: 'rgba(80,50,20,0.3)' }} />
                <div className="absolute" style={{ left: '3%', top: '8%', width: 80, height: 90 }}>
                  <div style={{ border: '3px solid #8899aa', background: 'linear-gradient(135deg,#d0eeff,#a8d8f0)', width: '100%', height: '100%', position: 'relative', boxShadow: 'inset 0 0 6px rgba(0,0,0,0.1)' }}>
                    <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2, background: '#8899aa' }} />
                    <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 2, background: '#8899aa' }} />
                    <div style={{ position: 'absolute', top: 5, left: 5, width: 20, height: 30, background: 'rgba(255,255,255,0.4)', transform: 'skewX(-10deg)' }} />
                  </div>
                </div>
                <div className="absolute" style={{ left: '50%', bottom: '42%', transform: 'translateX(-50%)' }}>
                  <div style={{ width: 110, height: 28, background: '#5d4037', border: '2px solid #4e342e', borderRadius: '4px 4px 0 0' }} />
                  <div style={{ width: 110, height: 18, background: '#795548', border: '2px solid #4e342e', display: 'flex', gap: 4, padding: '2px 4px', boxSizing: 'border-box' }}>
                    <div style={{ flex: 1, background: '#8d6e63', borderRadius: 2 }} />
                    <div style={{ flex: 1, background: '#8d6e63', borderRadius: 2 }} />
                  </div>
                  <div style={{ position: 'absolute', top: 0, left: -10, width: 10, height: 38, background: '#4e342e' }} />
                  <div style={{ position: 'absolute', top: 0, right: -10, width: 10, height: 38, background: '#4e342e' }} />
                </div>
                <div className="absolute" style={{ left: '38%', bottom: '41%', fontSize: 22 }}>🐱</div>
                <div className="absolute flex flex-col items-center" style={{ left: '50%', bottom: '42%', transform: 'translateX(-50%) translateX(-60px)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 52, fontVariationSettings: "'FILL' 1", color: '#a33e00', filter: 'drop-shadow(1px 2px 0 rgba(0,0,0,0.2))' }}>face</span>
                  <div style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid #ccc', padding: '1px 6px', fontSize: 9, fontFamily: 'Geist, monospace', marginTop: 2, whiteSpace: 'nowrap' }}>
                    {user?.nickname ?? '나'}
                  </div>
                </div>
                <div className="absolute flex items-center gap-1" style={{ top: 6, left: 8, background: 'rgba(255,255,255,0.85)', border: '1px solid #ccc', padding: '2px 7px' }}>
                  <span style={{ fontSize: 10, fontFamily: 'Geist, monospace', color: '#5a4136' }}>TODAY <span style={{ color: '#ba1a1a', fontWeight: 700 }}>123</span> | TOTAL 45,678</span>
                </div>
                <div className="absolute flex items-center gap-1" style={{ top: 6, right: 8, background: 'rgba(255,255,255,0.85)', border: '1px solid #ccc', padding: '2px 7px' }}>
                  <span className="material-symbols-outlined text-[#a33e00]" style={{ fontSize: 11 }}>music_note</span>
                  <span style={{ fontSize: 10, fontFamily: 'Geist, monospace', color: '#5a4136' }}>프리스타일 - Y</span>
                </div>
              </div>
            </div>

            {/* 글쓰기 */}
            <div className="window-inset border border-[#8e7164] bg-white">
              <div className="bg-[#e2e2e2] px-2 py-1 border-b border-[#8e7164] font-[Geist,monospace] text-[12px] font-semibold text-[#1a1c1c] flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">edit</span> 오늘 하루 기록하기
              </div>
              <div className="p-2 flex gap-2 items-center">
                <div className="w-8 h-8 flex-shrink-0 border border-[#8e7164] bg-[#eeeeee] overflow-hidden flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl text-[#a33e00]" style={{ fontVariationSettings: "'FILL' 1" }}>face</span>
                </div>
                <input
                  className="window-inset flex-1 text-[14px] p-1 focus:outline-none"
                  type="text"
                  placeholder="오늘 어떤 하루였나요? 다이어리 써보세요..."
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !isSubmitting && submitPost()}
                />
                <div className="flex gap-1">
                  <button className="retro-btn p-1 font-[Geist,monospace] text-[12px] font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">image</span>
                  </button>
                  <button className="retro-btn retro-btn-primary font-[Geist,monospace] text-[12px] font-semibold px-2 py-1" onClick={submitPost} disabled={isSubmitting}>작성</button>
                </div>
              </div>
            </div>

            {/* 피드 필터 */}
            <div className="flex gap-1">
              {(['전체 피드', '일촌만', '사진만'] as const).map((label, i) => {
                const val = (['전체', '일촌만', '사진만'] as const)[i]
                return (
                  <button
                    key={label}
                    className={`retro-btn font-[Geist,monospace] text-[12px] font-semibold px-2 py-1${filter === val ? ' retro-btn-primary' : ''}`}
                    onClick={() => setFilter(val)}
                  >{label}</button>
                )
              })}
            </div>

            {/* 피드 포스트 */}
            <div className="window-inset border border-[#8e7164] flex-1 flex flex-col bg-white">
              <div className="bg-[#e2e2e2] px-2 py-1 border-b border-[#8e7164] font-[Geist,monospace] text-[12px] font-semibold text-[#1a1c1c] flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">dynamic_feed</span> 일촌 소식
              </div>
              <div className="flex flex-col overflow-y-auto" style={{ maxHeight: 520 }}>
                {filteredPosts.length === 0 && !loading && (
                  <div className="p-8 text-center font-[Geist,monospace] text-[12px] text-[#5a4136]">
                    아직 피드가 없어요. 일촌을 추가해보세요!
                  </div>
                )}

                {filteredPosts.map((post, idx) => {
                  const liked = likedPostIds.has(post.postId)
                  return (
                    <div key={post.postId} className={`p-2 flex flex-col gap-2${idx < filteredPosts.length - 1 ? ' border-b border-[#e3bfb1]' : ''}`}>
                      <div className="flex gap-2 items-start">
                        <div className="w-10 h-10 flex-shrink-0 border border-[#8e7164] bg-[#eeeeee] overflow-hidden flex items-center justify-center">
                          <span className="material-symbols-outlined text-[28px] text-[#a33e00]" style={{ fontVariationSettings: "'FILL' 1" }}>face</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-1 mb-1">
                            <span className="font-[Geist,monospace] text-[12px] font-bold text-[#a33e00] cursor-pointer">{post.nickname}</span>
                            <span className="bg-[#baeaff] text-[#09657f] font-[Geist,monospace] text-[10px] px-1 rounded">일촌</span>
                            <span className="text-[#5a4136] font-[Geist,monospace] text-[12px] ml-auto">{formatTime(post.createdAt)}</span>
                          </div>
                          {post.title && <h3 className="font-['Bricolage_Grotesque',sans-serif] text-[16px] font-bold text-[#1a1c1c] mb-1">{post.title}</h3>}
                          <p className="text-[14px] text-[#1a1c1c] leading-relaxed">{post.content}</p>
                          {post.hashtags.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {post.hashtags.map(tag => (
                                <span key={tag} className="font-[Geist,monospace] text-[10px] text-[#0c6780] cursor-pointer hover:underline">#{tag}</span>
                              ))}
                            </div>
                          )}
                          {post.mediaUrls.length > 0 && (
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {post.mediaUrls.map(url => (
                                <img key={url} src={url} alt="" className="w-20 h-20 object-cover border border-[#8e7164]" />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          className="retro-btn font-[Geist,monospace] text-[12px] font-semibold px-2 py-1 flex items-center gap-1"
                          onClick={() => toggleLike(post.postId)}
                        >
                          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: liked ? "'FILL' 1" : "'FILL' 0", color: liked ? '#a33e00' : undefined }}>favorite</span>
                          좋아요 <span className="text-[#a33e00] font-bold">{post.likeCount}</span>
                        </button>
                        <button className="retro-btn font-[Geist,monospace] text-[12px] font-semibold px-2 py-1 flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">chat_bubble</span>
                          댓글 {post.commentCount}
                        </button>
                        <button className="retro-btn font-[Geist,monospace] text-[12px] font-semibold px-2 py-1 flex items-center gap-1 ml-auto">
                          <span className="material-symbols-outlined text-sm">share</span>
                        </button>
                      </div>

                      <div className="ml-6 flex gap-1">
                        <input
                          className="window-inset flex-1 text-[12px] p-1 focus:outline-none"
                          type="text"
                          placeholder="댓글 달기..."
                          value={commentInputs[post.postId] ?? ''}
                          onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.postId]: e.target.value }))}
                        />
                        <button className="retro-btn font-[Geist,monospace] text-[12px] font-semibold px-2 py-1">등록</button>
                      </div>
                    </div>
                  )
                })}

                <div className="p-2 flex justify-center border-t border-[#e3bfb1]">
                  {hasNext ? (
                    <button
                      className="retro-btn font-[Geist,monospace] text-[12px] font-semibold px-12 py-2 flex items-center gap-1"
                      onClick={() => loadFeed(cursor)}
                      disabled={loading}
                    >
                      <span className="material-symbols-outlined text-base">{loading ? 'hourglass_empty' : 'expand_more'}</span>
                      {loading ? '로딩 중...' : '더 보기'}
                    </button>
                  ) : (
                    loading && (
                      <span className="font-[Geist,monospace] text-[12px] text-[#5a4136]">로딩 중...</span>
                    )
                  )}
                </div>
              </div>
            </div>
          </main>
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

      {/* 모바일 하단 탭 */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center bg-[#e2e2e2] px-2 border-t-2 border-[#e3bfb1] h-16">
        {[
          { icon: 'home', label: '홈', active: true },
          { icon: 'edit_note', label: '다이어리' },
          { icon: 'photo_library', label: '사진첩' },
          { icon: 'forum', label: '방명록' },
          { icon: 'storefront', label: '상점' },
        ].map(tab => (
          <div key={tab.label} className={`flex flex-col items-center justify-center p-1 flex-1 cursor-pointer${tab.active ? ' bg-[#a33e00] text-white rounded-lg border-t-2 border-l-2 border-white border-r-2 border-b-2 border-[#7c2e00] mx-1' : ' text-[#5a4136]'}`}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: tab.active ? "'FILL' 1" : "'FILL' 0" }}>{tab.icon}</span>
            <span className="font-[Geist,monospace] text-[12px] font-semibold mt-1">{tab.label}</span>
          </div>
        ))}
      </nav>
    </div>
  )
}
