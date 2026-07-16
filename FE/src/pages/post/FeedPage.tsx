import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { postApi } from '../../api/post'
import { commentApi } from '../../api/comment'
import { authApi } from '../../api/auth'
import type { PostResponse, CommentResponse } from '../../types'
import { useAuthStore } from '../../store/authStore'

function formatTime(iso: string): string {
  const d = new Date(iso)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${mm}.${dd} · ${hh}:${min}`
}

const ONLINE_FRIENDS = [
  { name: '윤주원', status: '접속 중', online: true },
  { name: '김채린', status: '5분 전', online: true },
  { name: '김찬호', status: '20분 전', online: false },
]

type Visibility = 'ALL' | 'FRIEND' | 'PRIVATE'
const VISIBILITY_LABELS: Record<Visibility, string> = { ALL: '전체공개', FRIEND: '일촌공개', PRIVATE: '비공개' }

interface WriteForm {
  title: string
  content: string
  visibility: Visibility
  hashtags: string[]
  mediaUrls: string[]
}

const EMPTY_FORM: WriteForm = { title: '', content: '', visibility: 'ALL', hashtags: [], mediaUrls: [] }

export default function FeedPage() {
  const navigate = useNavigate()
  const { user, clearAuth } = useAuthStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const searchRequestIdRef = useRef(0)

  const [posts, setPosts] = useState<PostResponse[]>([])
  const [cursor, setCursor] = useState<number | undefined>(undefined)
  const [hasNext, setHasNext] = useState(false)
  const [loading, setLoading] = useState(false)
  const [likedPostIds, setLikedPostIds] = useState<Set<number>>(new Set())
  const [pendingLikeIds, setPendingLikeIds] = useState<Set<number>>(new Set())
  const [filter, setFilter] = useState<'전체' | '일촌만' | '사진만' | '북마크'>('전체')
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({})
  const [bookmarkedPostIds, setBookmarkedPostIds] = useState<Set<number>>(new Set())
  const [pendingBookmarkIds, setPendingBookmarkIds] = useState<Set<number>>(new Set())
  const [bookmarkPosts, setBookmarkPosts] = useState<PostResponse[]>([])
  const [bookmarkCursor, setBookmarkCursor] = useState<number | undefined>(undefined)
  const [bookmarkHasNext, setBookmarkHasNext] = useState(false)
  const [openCommentIds, setOpenCommentIds] = useState<Set<number>>(new Set())
  const [postComments, setPostComments] = useState<Record<number, CommentResponse[]>>({})
  const [commentLoading, setCommentLoading] = useState<Set<number>>(new Set())
  const [commentSubmitting, setCommentSubmitting] = useState<Set<number>>(new Set())
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [searchPosts, setSearchPosts] = useState<PostResponse[]>([])
  const [searchCursor, setSearchCursor] = useState<number | undefined>(undefined)
  const [searchHasNext, setSearchHasNext] = useState(false)
  const [searchError, setSearchError] = useState(false)

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<WriteForm>(EMPTY_FORM)
  const [tagInput, setTagInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const loadFeed = useCallback(async (cursorParam?: number) => {
    setLoading(true)
    try {
      const res = await postApi.getFeed(cursorParam)
      const { posts: newPosts, nextCursor, hasNext: more } = res.data.data
      setPosts(prev => cursorParam !== undefined ? [...prev, ...newPosts] : newPosts)
      setCursor(nextCursor ?? undefined)
      setHasNext(more)
      const liked = new Set(newPosts.filter(p => p.isLiked).map(p => p.postId))
      setLikedPostIds(prev => cursorParam !== undefined ? new Set([...prev, ...liked]) : liked)
      const bookmarked = new Set(newPosts.filter(p => p.isBookmarked).map(p => p.postId))
      setBookmarkedPostIds(prev => cursorParam !== undefined ? new Set([...prev, ...bookmarked]) : bookmarked)
    } catch (e) {
      console.error('피드 로드 실패', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadFeed() }, [loadFeed])

  const toggleLike = async (postId: number) => {
    if (pendingLikeIds.has(postId)) return
    const liked = likedPostIds.has(postId)
    setPendingLikeIds(prev => new Set(prev).add(postId))
    setLikedPostIds(prev => {
      const next = new Set(prev)
      liked ? next.delete(postId) : next.add(postId)
      return next
    })
    const applyLikeCount = (delta: number) => {
      const updater = (p: PostResponse) => p.postId === postId ? { ...p, likeCount: p.likeCount + delta } : p
      setPosts(prev => prev.map(updater))
      setSearchPosts(prev => prev.map(updater))
    }
    applyLikeCount(liked ? -1 : 1)
    try {
      if (liked) await postApi.unlikePost(postId)
      else await postApi.likePost(postId)
    } catch {
      setLikedPostIds(prev => {
        const next = new Set(prev)
        liked ? next.add(postId) : next.delete(postId)
        return next
      })
      applyLikeCount(liked ? 1 : -1)
    } finally {
      setPendingLikeIds(prev => {
        const next = new Set(prev)
        next.delete(postId)
        return next
      })
    }
  }

  const handleLogout = async () => {
    try { await authApi.logout() } catch { /* ignore */ }
    clearAuth()
    navigate('/auth/login')
  }

  const openModal = () => {
    setForm(EMPTY_FORM)
    setTagInput('')
    setImageFiles([])
    setImagePreviews([])
    setShowModal(true)
  }

  const closeModal = () => {
    if (isSubmitting || isUploading) return
    imagePreviews.forEach(url => URL.revokeObjectURL(url))
    setImageFiles([])
    setImagePreviews([])
    setSubmitError('')
    setShowModal(false)
  }

  const addTag = () => {
    const tag = tagInput.trim().replace(/^#/, '')
    if (!tag || form.hashtags.includes(tag)) { setTagInput(''); return }
    setForm(prev => ({ ...prev, hashtags: [...prev.hashtags, tag] }))
    setTagInput('')
  }

  const removeTag = (tag: string) => {
    setForm(prev => ({ ...prev, hashtags: prev.hashtags.filter(t => t !== tag) }))
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    const accepted = files.slice(0, Math.max(0, 5 - imageFiles.length))
    if (accepted.length === 0) return
    setImageFiles(prev => [...prev, ...accepted])
    setImagePreviews(prev => [...prev, ...accepted.map(f => URL.createObjectURL(f))])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeImage = (idx: number) => {
    URL.revokeObjectURL(imagePreviews[idx])
    setImageFiles(prev => prev.filter((_, i) => i !== idx))
    setImagePreviews(prev => prev.filter((_, i) => i !== idx))
  }

  const submitPost = async () => {
    if (!form.content.trim() || isSubmitting) return
    setIsSubmitting(true)
    setSubmitError('')
    try {
      let mediaUrls = form.mediaUrls
      if (imageFiles.length > 0) {
        setIsUploading(true)
        const uploadRes = await postApi.uploadImages(imageFiles)
        mediaUrls = uploadRes.data.data
        setIsUploading(false)
      }
      const res = await postApi.createPost({
        title: form.title.trim(),
        content: form.content.trim(),
        visibility: form.visibility,
        hashtags: form.hashtags,
        mediaUrls,
      })
      setPosts(prev => [res.data.data, ...prev])
      imagePreviews.forEach(url => URL.revokeObjectURL(url))
      setShowModal(false)
    } catch (e: any) {
      setSubmitError(e.response?.data?.message ?? '글 작성에 실패했습니다. 다시 시도해주세요.')
      setIsUploading(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const loadBookmarks = useCallback(async (cursorParam?: number) => {
    setLoading(true)
    try {
      const res = await postApi.getBookmarks(cursorParam)
      const { posts: newPosts, nextCursor, hasNext: more } = res.data.data
      setBookmarkPosts(prev => cursorParam !== undefined ? [...prev, ...newPosts] : newPosts)
      setBookmarkCursor(nextCursor ?? undefined)
      setBookmarkHasNext(more)
      setBookmarkedPostIds(prev => {
        const next = new Set(prev)
        newPosts.forEach(p => next.add(p.postId))
        return next
      })
    } catch (e) {
      console.error('북마크 로드 실패', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (filter === '북마크') loadBookmarks()
  }, [filter, loadBookmarks])

  const toggleBookmark = async (postId: number) => {
    if (pendingBookmarkIds.has(postId)) return
    const bookmarked = bookmarkedPostIds.has(postId)
    setPendingBookmarkIds(prev => new Set(prev).add(postId))
    setBookmarkedPostIds(prev => {
      const next = new Set(prev)
      bookmarked ? next.delete(postId) : next.add(postId)
      return next
    })
    try {
      if (bookmarked) {
        await postApi.unbookmark(postId)
        setBookmarkPosts(prev => prev.filter(p => p.postId !== postId))
      } else {
        await postApi.bookmark(postId)
      }
    } catch {
      setBookmarkedPostIds(prev => {
        const next = new Set(prev)
        bookmarked ? next.add(postId) : next.delete(postId)
        return next
      })
    } finally {
      setPendingBookmarkIds(prev => { const next = new Set(prev); next.delete(postId); return next })
    }
  }

  const toggleComments = async (postId: number) => {
    const isOpen = openCommentIds.has(postId)
    setOpenCommentIds(prev => {
      const next = new Set(prev)
      isOpen ? next.delete(postId) : next.add(postId)
      return next
    })
    if (!isOpen && !postComments[postId]) {
      setCommentLoading(prev => new Set(prev).add(postId))
      try {
        const res = await commentApi.getComments(postId)
        setPostComments(prev => ({ ...prev, [postId]: res.data.data }))
      } catch {
        setOpenCommentIds(prev => { const next = new Set(prev); next.delete(postId); return next })
      } finally {
        setCommentLoading(prev => { const next = new Set(prev); next.delete(postId); return next })
      }
    }
  }

  const submitComment = async (postId: number) => {
    const content = (commentInputs[postId] ?? '').trim()
    if (!content || commentSubmitting.has(postId)) return
    setCommentSubmitting(prev => new Set(prev).add(postId))
    try {
      await commentApi.createComment(postId, { content })
      setCommentInputs(prev => ({ ...prev, [postId]: '' }))
      const incComment = (p: PostResponse) => p.postId === postId ? { ...p, commentCount: p.commentCount + 1 } : p
      setPosts(prev => prev.map(incComment))
      setSearchPosts(prev => prev.map(incComment))
      try {
        const res = await commentApi.getComments(postId)
        setPostComments(prev => ({ ...prev, [postId]: res.data.data }))
      } catch {
        // 목록 갱신 실패는 조용히 처리
      }
    } catch {
      // 댓글 작성 실패 조용히 처리
    } finally {
      setCommentSubmitting(prev => { const next = new Set(prev); next.delete(postId); return next })
    }
  }

  const deleteComment = async (postId: number, commentId: number) => {
    try {
      await commentApi.deleteComment(postId, commentId)
      setPostComments(prev => ({
        ...prev,
        [postId]: (prev[postId] ?? []).filter(c => c.commentId !== commentId),
      }))
      const decComment = (p: PostResponse) => p.postId === postId ? { ...p, commentCount: Math.max(0, p.commentCount - 1) } : p
      setPosts(prev => prev.map(decComment))
      setSearchPosts(prev => prev.map(decComment))
    } catch {
      // 조용히 실패
    }
  }

  const loadSearch = useCallback(async (tag: string, cursorParam?: number) => {
    const reqId = ++searchRequestIdRef.current
    setLoading(true)
    setSearchError(false)
    try {
      const res = await postApi.searchByHashtag(tag, cursorParam)
      if (reqId !== searchRequestIdRef.current) return
      const { posts: newPosts, nextCursor, hasNext: more } = res.data.data
      setSearchPosts(prev => cursorParam !== undefined ? [...prev, ...newPosts] : newPosts)
      setSearchCursor(nextCursor ?? undefined)
      setSearchHasNext(more)
      setLikedPostIds(prev => {
        const next = new Set(prev)
        newPosts.forEach(p => p.isLiked ? next.add(p.postId) : next.delete(p.postId))
        return next
      })
      setBookmarkedPostIds(prev => {
        const next = new Set(prev)
        newPosts.forEach(p => p.isBookmarked ? next.add(p.postId) : next.delete(p.postId))
        return next
      })
    } catch (e) {
      if (reqId !== searchRequestIdRef.current) return
      console.error('해시태그 검색 실패', e)
      setSearchError(true)
    } finally {
      if (reqId === searchRequestIdRef.current) setLoading(false)
    }
  }, [])

  const selectTag = (tag: string) => {
    setSelectedTag(tag)
    setSearchPosts([])
    setSearchCursor(undefined)
    setSearchHasNext(false)
    loadSearch(tag)
  }

  const clearTag = () => {
    setSelectedTag(null)
    setSearchPosts([])
    setSearchError(false)
  }

  const filteredPosts = posts.filter(p => {
    if (filter === '사진만') return p.mediaUrls.length > 0
    return true
  })
  const displayPosts = selectedTag ? searchPosts : filter === '북마크' ? bookmarkPosts : filteredPosts

  return (
    <div className="min-h-screen pb-16 md:pb-0">

      {/* ── 다이어리 작성 모달 ── */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-3">
          <div className="c-card w-full max-w-lg flex flex-col" style={{ maxHeight: '90vh', overflow: 'hidden' }}>
            <div className="c-card-header flex-shrink-0">
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>edit_note</span>
              다이어리 쓰기
              <button
                onClick={closeModal}
                disabled={isSubmitting}
                className="ml-auto flex items-center justify-center w-6 h-6 rounded-full hover:bg-white/20 transition-colors"
                style={{ color: '#fff', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-4 flex flex-col gap-4 bg-white">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold" style={{ color: 'var(--c-navy)' }}>제목</label>
                <input
                  className="c-input"
                  type="text"
                  placeholder="제목을 입력하세요 (선택)"
                  maxLength={100}
                  value={form.title}
                  onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold" style={{ color: 'var(--c-navy)' }}>
                  내용 <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="c-input resize-none"
                  placeholder="오늘 어떤 하루였나요?"
                  rows={6}
                  maxLength={2000}
                  value={form.content}
                  onChange={e => setForm(prev => ({ ...prev, content: e.target.value }))}
                />
                <span className="text-right text-[10px]" style={{ color: 'var(--c-sub)', fontFamily: 'IBM Plex Mono' }}>{form.content.length}/2000</span>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold" style={{ color: 'var(--c-navy)' }}>공개범위</label>
                <div className="flex gap-2">
                  {(['ALL', 'FRIEND', 'PRIVATE'] as Visibility[]).map(v => (
                    <button
                      key={v}
                      className={`flex-1 py-1.5 rounded-full text-[12px] font-bold border-[1.5px] transition-all ${
                        form.visibility === v
                          ? 'text-white'
                          : 'bg-white hover:bg-[#eef4fb]'
                      }`}
                      style={
                        form.visibility === v
                          ? { background: 'var(--c-navy)', borderColor: 'var(--c-navy)', color: '#fff' }
                          : { color: 'var(--c-blue)', borderColor: 'var(--c-card-border)' }
                      }
                      onClick={() => setForm(prev => ({ ...prev, visibility: v }))}
                    >
                      {VISIBILITY_LABELS[v]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold" style={{ color: 'var(--c-navy)' }}>해시태그</label>
                <div className="flex gap-2">
                  <input
                    className="c-input flex-1"
                    type="text"
                    placeholder="#태그 입력 후 Enter"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                  />
                  <button className="c-sb-btn c-sb-btn--outline" style={{ width: 'auto', padding: '6px 16px', borderRadius: 8 }} onClick={addTag}>
                    추가
                  </button>
                </div>
                {form.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {form.hashtags.map(tag => (
                      <span key={tag} className="c-p-tag flex items-center gap-1">
                        #{tag}
                        <button onClick={() => removeTag(tag)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 12 }}>close</span>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold" style={{ color: 'var(--c-navy)' }}>
                  사진 첨부 <span style={{ fontWeight: 400, color: 'var(--c-sub)' }}>(최대 5장)</span>
                </label>
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
                <button
                  className="c-sb-btn c-sb-btn--outline"
                  style={{ width: 'auto', alignSelf: 'flex-start', padding: '6px 16px', borderRadius: 8 }}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={imageFiles.length >= 5}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>image</span>
                  사진 선택
                </button>
                {imagePreviews.length > 0 && (
                  <div className="flex gap-2 flex-wrap mt-1">
                    {imagePreviews.map((url, idx) => (
                      <div key={idx} className="relative">
                        <img src={url} alt="" className="w-20 h-20 object-cover rounded-lg" style={{ border: '1.5px solid var(--c-card-border)' }} />
                        <button
                          className="absolute top-0 right-0 flex items-center justify-center bg-red-500 text-white rounded-tr-lg rounded-bl-lg"
                          style={{ width: 20, height: 20, border: 'none', cursor: 'pointer' }}
                          onClick={() => removeImage(idx)}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {submitError && (
              <p className="px-4 py-2 text-[12px] text-red-600 bg-white" style={{ borderTop: '1px solid var(--c-card-border)' }}>{submitError}</p>
            )}

            <div className="px-4 py-3 flex gap-2 flex-shrink-0 bg-white" style={{ borderTop: '1.5px solid var(--c-card-border)' }}>
              <button className="c-sb-btn c-sb-btn--outline flex-1" style={{ borderRadius: 20 }} onClick={closeModal} disabled={isSubmitting}>취소</button>
              <button
                className="c-sb-btn c-sb-btn--primary flex-1"
                style={{ borderRadius: 20 }}
                onClick={submitPost}
                disabled={isSubmitting || !form.content.trim()}
              >
                {isUploading ? (
                  <><span className="material-symbols-outlined animate-spin" style={{ fontSize: 15 }}>autorenew</span> 업로드 중...</>
                ) : isSubmitting ? (
                  <><span className="material-symbols-outlined" style={{ fontSize: 15 }}>hourglass_empty</span> 등록 중...</>
                ) : '작성 완료'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Desktop GNB ── */}
      <nav className="c-gnb hidden md:flex">
        <div className="c-logo">싸이<span className="c-logo-accent">월드</span></div>
        <div className="flex gap-1">
          {[
            { label: '홈', path: '/', active: true },
            { label: '내 홈피', path: `/home/${user?.id ?? 'me'}` },
            { label: '일촌', path: '/friends' },
            { label: '채팅', path: '/chat' },
            { label: '상점', path: '/shop' },
          ].map(item => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`c-gnb-item${item.active ? ' c-gnb-item--active' : ''}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="c-acorn-pill">🌰 88</div>
          {user && (
            <button className="c-user-pill" onClick={() => navigate('/settings')}>
              {user.nickname} 님
            </button>
          )}
          {!user && (
            <button className="c-user-pill" onClick={() => navigate('/auth/login')}>
              로그인
            </button>
          )}
        </div>
      </nav>

      {/* ── Mobile Header ── */}
      <header className="c-mobile-header md:hidden">
        <div className="c-logo" style={{ fontSize: 17 }}>싸이<span className="c-logo-accent">월드</span></div>
        <div className="flex items-center gap-2">
          {user && <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 700 }}>{user.nickname}</span>}
          <button
            onClick={() => navigate('/settings')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 4 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#fff' }}>settings</span>
          </button>
        </div>
      </header>

      {/* ── Main Layout ── */}
      <div className="c-layout" style={{ marginTop: '14px' }}>
        {/* Mobile: push content below fixed header */}
        <div className="md:hidden" style={{ height: 46 }} />

        {/* ── Sidebar ── */}
        <aside className="c-sidebar">

          {/* Miniroom card */}
          <div className="c-card overflow-hidden">
            <div
              className="relative cursor-pointer group"
              style={{ height: 130, background: 'linear-gradient(to bottom, #d6eaf8 60%, #c4a882)', overflow: 'hidden' }}
              onClick={() => navigate('/room')}
            >
              {/* 바닥 */}
              <div style={{ position: 'absolute', bottom: '38%', left: 0, right: 0, height: 1, background: 'rgba(0,0,0,0.08)' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '38%', background: 'linear-gradient(to bottom, transparent, rgba(180,140,90,0.18))', pointerEvents: 'none' }} />
              {/* TV */}
              <div className="absolute" style={{ left: '8%', bottom: '40%' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 26, color: '#212121', fontVariationSettings: "'FILL' 1" }}>tv</span>
              </div>
              {/* 소파 */}
              <div className="absolute" style={{ left: '50%', bottom: '38%', transform: 'translateX(-50%)' }}>
                <div style={{ width: 54, height: 13, background: '#5d4037', borderRadius: '4px 4px 0 0' }} />
                <div style={{ width: 54, height: 9, background: '#795548' }} />
                <div style={{ position: 'absolute', top: 0, left: -5, width: 5, height: 17, background: '#4e342e' }} />
                <div style={{ position: 'absolute', top: 0, right: -5, width: 5, height: 17, background: '#4e342e' }} />
              </div>
              {/* 화분 */}
              <div className="absolute" style={{ right: '8%', bottom: '39%' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#388e3c', fontVariationSettings: "'FILL' 1" }}>potted_plant</span>
              </div>
              {/* 미니미 */}
              <div className="absolute flex flex-col items-center" style={{ left: '28%', bottom: '38%', transform: 'translateX(-50%)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 28, fontVariationSettings: "'FILL' 1", color: 'var(--c-navy)' }}>face</span>
                <div style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid #ccc', padding: '1px 4px', fontSize: 8, fontFamily: 'IBM Plex Mono, monospace', whiteSpace: 'nowrap', borderRadius: 2 }}>
                  {user?.nickname ?? '나'}
                </div>
              </div>
              {/* 호버 오버레이 */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'rgba(10,36,106,0.32)' }}>
                <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, fontWeight: 700, color: '#fff' }}>미니룸 꾸미기</span>
              </div>
            </div>
            <div style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, fontWeight: 700, color: 'var(--c-navy)' }}>내 미니룸</span>
              <button
                className="c-sb-btn c-sb-btn--outline"
                style={{ padding: '3px 10px', fontSize: 11, borderRadius: 12 }}
                onClick={() => navigate('/room')}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 13 }}>open_in_full</span>
                꾸미기
              </button>
            </div>
          </div>

          {/* Profile card */}
          <div className="c-card">
            <div className="c-card-header">
              <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--c-light)' }}>account_circle</span>
              내 프로필
            </div>
            <div className="c-profile-inner">
              <div className="c-profile-photo">
                <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--c-mid)', fontVariationSettings: "'FILL' 1" }}>face</span>
              </div>
              <div className="c-profile-name">{user?.nickname ?? '게스트'}의 홈피</div>
              <div className="c-profile-sub">{user ? '함께해요 싸이월드!' : '로그인하고 시작하세요'}</div>
              {user && <div className="c-mood-tag">😊 오늘의 기분: 맑음</div>}
              <div className="c-visit-row">
                <div className="c-visit-item"><span className="c-visit-num">42</span>오늘</div>
                <div className="c-visit-item"><span className="c-visit-num">1.2K</span>전체</div>
                <div className="c-visit-item"><span className="c-visit-num">🌰 88</span>도토리</div>
              </div>

              {user ? (
                <>
                  <button className="c-sb-btn c-sb-btn--primary" onClick={() => navigate(`/home/${user.id}`)}>
                    <span className="material-symbols-outlined" style={{ fontSize: 15 }}>home</span> 내 홈피 가기
                  </button>
                  <button className="c-sb-btn c-sb-btn--outline" onClick={openModal}>
                    <span className="material-symbols-outlined" style={{ fontSize: 15 }}>edit_note</span> 다이어리 쓰기
                  </button>
                  <button className="c-sb-btn c-sb-btn--ghost" onClick={() => navigate('/settings')}>
                    <span className="material-symbols-outlined" style={{ fontSize: 15 }}>settings</span> 설정
                  </button>
                  <button className="c-sb-btn c-sb-btn--danger" onClick={handleLogout}>
                    <span className="material-symbols-outlined" style={{ fontSize: 15 }}>logout</span> 로그아웃
                  </button>
                </>
              ) : (
                <>
                  <button className="c-sb-btn c-sb-btn--primary" onClick={() => navigate('/auth/login')}>
                    <span className="material-symbols-outlined" style={{ fontSize: 15 }}>login</span> 로그인
                  </button>
                  <button className="c-sb-btn c-sb-btn--outline" onClick={() => navigate('/auth/signup')}>
                    <span className="material-symbols-outlined" style={{ fontSize: 15 }}>person_add</span> 회원가입
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Friends card */}
          {user && (
            <div className="c-card">
              <div className="c-card-header">
                <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--c-light)' }}>group</span>
                접속 중인 일촌
                <span className="c-header-badge">3</span>
              </div>
              <div className="c-friends-inner">
                {ONLINE_FRIENDS.map(f => (
                  <div key={f.name} className="c-friend-row">
                    <div className="c-f-avatar">
                      <span className="material-symbols-outlined" style={{ fontSize: 17, color: 'var(--c-mid)', fontVariationSettings: "'FILL' 1" }}>face</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="c-f-name">{f.name}</div>
                      <div className="c-f-time">{f.status}</div>
                    </div>
                    <div className="c-online-dot" style={{ background: f.online ? '#22c55e' : '#d1d5db' }} />
                  </div>
                ))}
                <button className="c-sb-btn c-sb-btn--outline" style={{ marginTop: 4 }} onClick={() => navigate('/friends')}>
                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>people</span> 일촌 관리
                </button>
              </div>
            </div>
          )}
        </aside>

        {/* ── Feed ── */}
        <main className="c-feed">

          {/* Feed header */}
          <div className="c-card">
            <div className="c-card-header">
              <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--c-light)' }}>
                {selectedTag ? 'tag' : 'auto_stories'}
              </span>
              {selectedTag ? (
                <>
                  <span style={{ color: 'var(--c-light)' }}>#{selectedTag}</span>
                  <span style={{ color: '#a8ccee' }}> 검색 결과</span>
                </>
              ) : '일촌 다이어리'}
              {selectedTag ? (
                <button
                  onClick={clearTag}
                  className="flex items-center gap-1 hover:text-white transition-colors"
                  style={{ marginLeft: 'auto', color: '#a8ccee', fontSize: 11, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 13 }}>close</span>
                  피드로 돌아가기
                </button>
              ) : (
                <button className="c-write-btn-pill" onClick={openModal}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>edit_note</span> 새 글
                </button>
              )}
            </div>
            <div className="c-filter-bar">
              {(['전체', '일촌만', '사진만', '북마크'] as const).map(f => (
                <button
                  key={f}
                  className={`c-filter-pill${filter === f ? ' c-filter-pill--active' : ''}`}
                  onClick={() => setFilter(f)}
                >{f}</button>
              ))}
            </div>
          </div>

          {/* Empty state */}
          {displayPosts.length === 0 && !loading && (
            <div className="c-card" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--c-sub)', fontFamily: 'IBM Plex Mono', fontSize: 13 }}>
              {selectedTag && searchError ? (
                <span style={{ color: '#ef4444' }}>
                  검색에 실패했어요.{' '}
                  <button style={{ textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }} onClick={() => loadSearch(selectedTag)}>다시 시도</button>
                </span>
              ) : selectedTag
                ? `#${selectedTag} 태그가 달린 게시물이 없어요.`
                : filter === '북마크'
                  ? '북마크한 게시물이 없어요.'
                  : '아직 피드가 없어요. 일촌을 추가해보세요!'}
            </div>
          )}

          {/* Posts */}
          {displayPosts.map(post => {
            const liked = likedPostIds.has(post.postId)
            const bookmarked = bookmarkedPostIds.has(post.postId)
            const commentsOpen = openCommentIds.has(post.postId)

            return (
              <div key={post.postId} className="c-post">
                <div className="c-post-top">
                  <div className="c-p-avatar">
                    <span className="material-symbols-outlined" style={{ fontSize: 22, color: 'var(--c-mid)', fontVariationSettings: "'FILL' 1" }}>face</span>
                  </div>
                  <div>
                    <div className="c-p-author">{post.nickname}</div>
                    <div className="c-p-time">{formatTime(post.createdAt)}</div>
                  </div>
                  <div className="c-vis-chip">{VISIBILITY_LABELS[post.visibility]}</div>
                </div>

                <div className="c-post-body">
                  {post.title && <div className="c-post-title">{post.title}</div>}
                  <div className="c-post-text">{post.content ?? ''}</div>
                  {post.hashtags.length > 0 && (
                    <div className="c-tag-row">
                      {post.hashtags.map(tag => (
                        <button key={tag} type="button" className="c-p-tag" onClick={() => selectTag(tag)}>
                          #{tag}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {post.mediaUrls.length > 0 && (
                  <div className="c-img-row">
                    {post.mediaUrls.map(url => (
                      <img
                        key={url}
                        src={url}
                        alt=""
                        className="object-cover rounded-lg"
                        style={{ flex: 1, aspectRatio: '4/3', minWidth: 0, border: '1px solid var(--c-card-border)' }}
                      />
                    ))}
                  </div>
                )}

                <div className="c-post-bottom">
                  <button
                    className={`c-react-btn${liked ? ' c-react-btn--active' : ''}`}
                    onClick={() => toggleLike(post.postId)}
                    disabled={pendingLikeIds.has(post.postId)}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: liked ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                    {post.likeCount}
                  </button>
                  <button
                    className={`c-react-btn${commentsOpen ? ' c-react-btn--active' : ''}`}
                    onClick={() => toggleComments(post.postId)}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>comment</span>
                    {post.commentCount}
                  </button>
                  <button
                    className={`c-react-btn${bookmarked ? ' c-react-btn--saved' : ''}`}
                    onClick={() => toggleBookmark(post.postId)}
                    disabled={pendingBookmarkIds.has(post.postId)}
                    aria-label={bookmarked ? '북마크 해제' : '북마크'}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: bookmarked ? "'FILL' 1" : "'FILL' 0" }}>bookmark</span>
                  </button>
                  <button className="c-react-btn" style={{ marginLeft: 'auto' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>share</span>
                  </button>
                </div>

                {/* Comments */}
                {commentsOpen && (
                  <div style={{ borderTop: '1px solid #f0f4f8', background: '#fafcfe', padding: '12px 14px' }}>
                    {commentLoading.has(post.postId) ? (
                      <p style={{ fontSize: 11, color: 'var(--c-sub)', textAlign: 'center', padding: '8px 0' }}>불러오는 중...</p>
                    ) : (postComments[post.postId] ?? []).length === 0 ? (
                      <p style={{ fontSize: 11, color: 'var(--c-sub)', textAlign: 'center', padding: '8px 0' }}>첫 댓글을 남겨보세요!</p>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {(postComments[post.postId] ?? []).map(c => (
                          <div
                            key={c.commentId}
                            className="flex gap-2 items-start py-1"
                            style={c.parentCommentId ? { marginLeft: 24 } : undefined}
                          >
                            {c.parentCommentId && (
                              <span className="material-symbols-outlined" style={{ fontSize: 13, color: 'var(--c-sub)', marginTop: 2 }}>subdirectory_arrow_right</span>
                            )}
                            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-navy)', flexShrink: 0 }}>{c.nickname}</span>
                            <span style={{ fontSize: 12, color: 'var(--c-text)', flex: 1, lineHeight: 1.6 }}>{c.content}</span>
                            {user?.id === c.userId && (
                              <button
                                style={{ fontSize: 10, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}
                                className="hover:underline"
                                onClick={() => deleteComment(post.postId, c.commentId)}
                              >삭제</button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2 mt-2">
                      <input
                        className="c-input flex-1"
                        style={{ fontSize: 12, padding: '6px 10px' }}
                        type="text"
                        placeholder="댓글 달기..."
                        value={commentInputs[post.postId] ?? ''}
                        onChange={e => setCommentInputs(prev => ({ ...prev, [post.postId]: e.target.value }))}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) submitComment(post.postId) }}
                      />
                      <button
                        className="c-sb-btn c-sb-btn--primary"
                        style={{ width: 'auto', padding: '6px 14px', borderRadius: 20, fontSize: 12 }}
                        onClick={() => submitComment(post.postId)}
                        disabled={commentSubmitting.has(post.postId)}
                      >
                        등록
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {/* Load more */}
          <div className="c-card" style={{ padding: '16px', display: 'flex', justifyContent: 'center' }}>
            {(selectedTag ? searchHasNext : filter === '북마크' ? bookmarkHasNext : hasNext) ? (
              <button
                className="c-sb-btn c-sb-btn--outline"
                style={{ width: 'auto', padding: '8px 32px', borderRadius: 20 }}
                onClick={() => selectedTag ? loadSearch(selectedTag, searchCursor) : filter === '북마크' ? loadBookmarks(bookmarkCursor) : loadFeed(cursor)}
                disabled={loading}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{loading ? 'hourglass_empty' : 'expand_more'}</span>
                {loading ? '로딩 중...' : '더 보기'}
              </button>
            ) : (
              loading
                ? <span style={{ fontSize: 12, color: 'var(--c-sub)', fontFamily: 'IBM Plex Mono' }}>로딩 중...</span>
                : <span style={{ fontSize: 11, color: 'var(--c-sub)', fontFamily: 'IBM Plex Mono' }}>모든 글을 불러왔어요.</span>
            )}
          </div>

        </main>
      </div>
    </div>
  )
}
