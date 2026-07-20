import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { postApi } from '../../api/post'
import { commentApi } from '../../api/comment'
import { roomApi } from '../../api/room'
import type { PostResponse, CommentResponse, RoomResponse, MinihompyMainResponse, BgmOptionResponse } from '../../types'
import { useAuthStore } from '../../store/authStore'
import { minihompyApi } from '../../api/minihompy'
import MinihompySettingsModal from '../../components/MinihompySettingsModal'
import { parseMood } from '../../utils/mood'
import ProfileImageMenuModal from '../../components/ProfileImageMenuModal'
import BgmPlayer from '../../components/BgmPlayer'
import { useMinihompyStore } from '../../store/minihompyStore'
import UserNameLink from '../../components/UserNameLink'

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

const MINIROOM_ASSET_ROOT = '/miniroom-assets'
const MINIROOM_WIDTH = 750
const MINIROOM_HEIGHT = 606

function MiniroomFeedPreview({ room, nickname }: { room: RoomResponse | null; nickname?: string }) {
  const backgroundUrl = room?.backgroundAssetUrl ?? `${MINIROOM_ASSET_ROOT}/rooms/room-pink.svg`
  const savedItems = [...(room?.items ?? [])].sort((a, b) => a.sortOrder - b.sortOrder)
  const hasSavedItems = savedItems.length > 0
  const avatar = room?.avatar
  const hasRoomContent = hasSavedItems || Boolean(avatar?.avatarInventoryId)
  const shouldShowFallbackItems = room == null

  return (
    <div className="relative w-full bg-[#dff6f4]" style={{ height: 280, overflow: 'hidden' }}>
      <img
        src={backgroundUrl}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        style={{ imageRendering: 'auto' }}
      />

      {hasRoomContent ? (
        <>
          {savedItems.map(item => (
            <div
              key={item.roomItemId}
              className="absolute"
              title={item.name}
              style={{
                left: `${(item.posX / MINIROOM_WIDTH) * 100}%`,
                top: `${(item.posY / MINIROOM_HEIGHT) * 100}%`,
                width: `${((item.assetWidth ?? 80) / MINIROOM_WIDTH) * 100}%`,
                zIndex: item.sortOrder,
                transform: `scale(${item.scale ?? 1}) rotate(${item.rotation ?? 0}deg)`,
                transformOrigin: 'center bottom',
                filter: 'drop-shadow(2px 5px 2px rgba(44, 58, 65, 0.16))',
              }}
            >
              {item.assetUrl ? (
                <img
                  src={item.assetUrl}
                  alt=""
                  className="block w-full"
                  style={{
                    imageRendering: 'pixelated',
                    transform: `scaleX(${item.flipped ? -1 : 1})`,
                  }}
                />
              ) : (
                <span className="material-symbols-outlined text-[#a33e00]" style={{ fontSize: 42, fontVariationSettings: "'FILL' 1" }}>
                  {item.category === 'AVATAR' ? 'face' : 'inventory_2'}
                </span>
              )}
            </div>
          ))}
          {avatar?.avatarInventoryId ? (
            <div
              className="absolute flex flex-col items-center"
              style={{
                left: `${((avatar.posX ?? 318) / MINIROOM_WIDTH) * 100}%`,
                top: `${((avatar.posY ?? 438) / MINIROOM_HEIGHT) * 100}%`,
                zIndex: 10000,
                transform: `scale(${avatar.scale ?? 1})`,
                transformOrigin: 'center bottom',
              }}
            >
              <img
                src={`${MINIROOM_ASSET_ROOT}/avatars-grafxkid/grafxkid_avatar_01.png`}
                alt=""
                style={{
                  width: 36,
                  imageRendering: 'pixelated',
                  transform: `scaleX(${avatar.flipped ? -1 : 1})`,
                }}
              />
            </div>
          ) : null}
        </>
      ) : shouldShowFallbackItems ? (
        <>
          <div className="absolute" style={{ left: '50%', top: '52%', transform: 'translate(-50%, -50%)' }}>
            <img
              src={`${MINIROOM_ASSET_ROOT}/items/sofa_blue.png`}
              alt=""
              style={{ width: 126, imageRendering: 'pixelated' }}
            />
          </div>
          <div className="absolute flex flex-col items-center" style={{ left: '43%', top: '48%' }}>
            <img
              src={`${MINIROOM_ASSET_ROOT}/avatars-grafxkid/grafxkid_avatar_01.png`}
              alt=""
              style={{ width: 36, imageRendering: 'pixelated' }}
            />
            <div style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid #ccc', padding: '1px 6px', fontSize: 9, fontFamily: 'Geist, monospace', marginTop: 2, whiteSpace: 'nowrap' }}>
              {nickname ?? '미니미'}
            </div>
          </div>
        </>
      ) : null}

      <div className="absolute flex items-center gap-1" style={{ top: 6, left: 8, background: 'rgba(255,255,255,0.85)', border: '1px solid #ccc', padding: '2px 7px' }}>
        <span style={{ fontSize: 10, fontFamily: 'Geist, monospace', color: '#5a4136' }}>TODAY <span style={{ color: '#ba1a1a', fontWeight: 700 }}>123</span> | TOTAL 45,678</span>
      </div>
      <div className="absolute flex items-center gap-1" style={{ top: 6, right: 8, background: 'rgba(255,255,255,0.85)', border: '1px solid #ccc', padding: '2px 7px' }}>
        <span className="material-symbols-outlined text-[#a33e00]" style={{ fontSize: 11 }}>music_note</span>
        <span style={{ fontSize: 10, fontFamily: 'Geist, monospace', color: '#5a4136' }}>프리스타일 - Y</span>
      </div>
    </div>
  )
}

export default function FeedPage() {
  const navigate = useNavigate()
  const location = useLocation()
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
  const [roomPreview, setRoomPreview] = useState<RoomResponse | null>(null)
const { main, setMain, clearMain } = useMinihompyStore()

// 프로필 사진 메뉴(팝업) 열림/닫힘
const [showProfileMenu, setShowProfileMenu] = useState(false)
// 숨겨진 input을 클릭시키기 위한 ref
const profileInputRef = useRef<HTMLInputElement>(null)
  
  // 미니홈피 설정 모달
  const [showSettings, setShowSettings] = useState(false)

  // BGM
  const [currentTrackName, setCurrentTrackName] = useState<string | null>(null)

  // 다이어리 작성 모달
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

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) {
      setRoomPreview(null)
      return
    }

    let ignore = false
    roomApi.getMyRoom()
      .then(response => {
        if (!ignore) setRoomPreview(response.data.data)
      })
      .catch(() => {
        if (!ignore) setRoomPreview(null)
      })

    return () => {
      ignore = true
    }
  }, [user?.id])

  // 미니홈피 메인 조회
  useEffect(() => {
  if (!localStorage.getItem('accessToken')) {
    setMain(null)
    return
  }

  let ignore = false
  minihompyApi.getMyMinihompy()
    .then(res => {
      if (!ignore) setMain(res.data.data)
    })
    .catch(() => {
      if (!ignore) setMain(null)
    })

  return () => {
    ignore = true
  }
}, [user?.id])

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
      setBookmarkPosts(prev => prev.map(updater))
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
    if (tag.length > 50) { setTagInput(''); return }
    if (form.hashtags.length >= 30) { setTagInput(''); return }
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
    // unbookmark 시 목록에서 즉시 제거 (낙관적 업데이트), 실패 시 복구
    let removedPost: PostResponse | undefined
    if (bookmarked) {
      setBookmarkPosts(prev => {
        removedPost = prev.find(p => p.postId === postId)
        return prev.filter(p => p.postId !== postId)
      })
    }
    try {
      if (bookmarked) {
        await postApi.unbookmark(postId)
      } else {
        await postApi.bookmark(postId)
      }
    } catch {
      setBookmarkedPostIds(prev => {
        const next = new Set(prev)
        bookmarked ? next.add(postId) : next.delete(postId)
        return next
      })
      if (bookmarked && removedPost) {
        setBookmarkPosts(prev => {
          const idx = prev.findIndex(p => p.postId < postId)
          if (idx === -1) return [...prev, removedPost!]
          return [...prev.slice(0, idx), removedPost!, ...prev.slice(idx)]
        })
      }
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
        // 실패 시 펼침 취소
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
      setBookmarkPosts(prev => prev.map(incComment))
      try {
        const res = await commentApi.getComments(postId)
        setPostComments(prev => ({ ...prev, [postId]: res.data.data }))
      } catch {
        // 목록 갱신 실패는 조용히 처리 (댓글 작성은 성공)
      }
    } catch {
      // 댓글 작성 자체 실패 — 조용히 처리
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
      setBookmarkPosts(prev => prev.map(decComment))
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
    if (filter === '일촌만') return p.userId !== user?.id
    if (filter === '사진만') return p.mediaUrls.length > 0
    return true
  })
  const displayPosts = selectedTag ? searchPosts : filter === '북마크' ? bookmarkPosts : filteredPosts

  const { emoji: moodEmoji, text: moodText } = parseMood(main?.mood)

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



  return (
    <div className="min-h-screen text-[#1a1c1c] py-6 flex justify-center items-start">

      {/* 다이어리 작성 모달 */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-2">
          <div className="window-frame bg-[#f9f9f9] w-full max-w-lg flex flex-col" style={{ maxHeight: '90vh' }}>
            {/* 모달 타이틀바 */}
            <div className="bg-[#e2e2e2] px-3 py-2 border-b-2 border-[#8e7164] flex items-center gap-2 flex-shrink-0">
              <span className="material-symbols-outlined text-sm text-[#a33e00]">edit_note</span>
              <span className="font-[Geist,monospace] text-[13px] font-bold text-[#1a1c1c]">다이어리 쓰기</span>
              <button className="ml-auto retro-btn p-1" onClick={closeModal} disabled={isSubmitting}>
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-3 flex flex-col gap-3">
              {/* 제목 */}
              <div className="flex flex-col gap-1">
                <label className="font-[Geist,monospace] text-[12px] font-semibold text-[#5a4136]">제목</label>
                <input
                  className="window-inset p-2 text-[14px] focus:outline-none w-full"
                  type="text"
                  placeholder="제목을 입력하세요 (선택)"
                  maxLength={100}
                  value={form.title}
                  onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              {/* 내용 */}
              <div className="flex flex-col gap-1">
                <label className="font-[Geist,monospace] text-[12px] font-semibold text-[#5a4136]">내용 <span className="text-[#ba1a1a]">*</span></label>
                <textarea
                  className="window-inset p-2 text-[14px] focus:outline-none w-full resize-none"
                  placeholder="오늘 어떤 하루였나요?"
                  rows={6}
                  maxLength={2000}
                  value={form.content}
                  onChange={(e) => setForm(prev => ({ ...prev, content: e.target.value }))}
                />
                <span className="font-[Geist,monospace] text-[10px] text-[#5a4136] text-right">{form.content.length}/2000</span>
              </div>

              {/* 공개범위 */}
              <div className="flex flex-col gap-1">
                <label className="font-[Geist,monospace] text-[12px] font-semibold text-[#5a4136]">공개범위</label>
                <div className="flex gap-1">
                  {(['ALL', 'FRIEND', 'PRIVATE'] as Visibility[]).map(v => (
                    <button
                      key={v}
                      className={`retro-btn font-[Geist,monospace] text-[12px] font-semibold px-3 py-1 flex-1${form.visibility === v ? ' retro-btn-primary' : ''}`}
                      onClick={() => setForm(prev => ({ ...prev, visibility: v }))}
                    >
                      {VISIBILITY_LABELS[v]}
                    </button>
                  ))}
                </div>
              </div>

              {/* 해시태그 */}
              <div className="flex flex-col gap-1">
                <label className="font-[Geist,monospace] text-[12px] font-semibold text-[#5a4136]">해시태그</label>
                <div className="flex gap-1">
                  <input
                    className="window-inset flex-1 p-2 text-[13px] focus:outline-none"
                    type="text"
                    placeholder="#태그 입력 후 Enter"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                  />
                  <button className="retro-btn font-[Geist,monospace] text-[12px] font-semibold px-2 py-1" onClick={addTag}>추가</button>
                </div>
                {form.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {form.hashtags.map(tag => (
                      <span key={tag} className="flex items-center gap-1 bg-[#baeaff] text-[#09657f] font-[Geist,monospace] text-[11px] px-2 py-0.5 rounded">
                        #{tag}
                        <button onClick={() => removeTag(tag)} className="hover:text-[#ba1a1a]">
                          <span className="material-symbols-outlined text-[13px]">close</span>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 이미지 업로드 */}
              <div className="flex flex-col gap-1">
                <label className="font-[Geist,monospace] text-[12px] font-semibold text-[#5a4136]">사진 첨부 <span className="text-[#5a4136] font-normal">(최대 5장)</span></label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageSelect}
                />
                <button
                  className="retro-btn font-[Geist,monospace] text-[12px] font-semibold px-3 py-2 flex items-center gap-1 self-start"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={imageFiles.length >= 5}
                >
                  <span className="material-symbols-outlined text-sm">image</span>
                  사진 선택
                </button>
                {imagePreviews.length > 0 && (
                  <div className="flex gap-2 flex-wrap mt-1">
                    {imagePreviews.map((url, idx) => (
                      <div key={idx} className="relative">
                        <img src={url} alt="" className="w-20 h-20 object-cover border border-[#8e7164]" />
                        <button
                          className="absolute top-0 right-0 bg-[#ba1a1a] text-white rounded-bl"
                          onClick={() => removeImage(idx)}
                        >
                          <span className="material-symbols-outlined text-[14px] leading-none p-0.5">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 에러 메시지 */}
            {submitError && (
              <p className="px-3 py-1 font-[Geist,monospace] text-[12px] text-[#ba1a1a] border-t border-[#8e7164]">{submitError}</p>
            )}

            {/* 버튼 영역 */}
            <div className="px-3 py-2 border-t border-[#8e7164] flex gap-2 flex-shrink-0">
              <button className="retro-btn font-[Geist,monospace] text-[12px] font-semibold px-4 py-2 flex-1" onClick={closeModal} disabled={isSubmitting}>취소</button>
              <button
                className="retro-btn retro-btn-primary font-[Geist,monospace] text-[12px] font-semibold px-4 py-2 flex-1 flex items-center justify-center gap-1"
                onClick={submitPost}
                disabled={isSubmitting || !form.content.trim()}
              >
                {isUploading ? (
                  <><span className="material-symbols-outlined text-sm animate-spin">autorenew</span> 업로드 중...</>
                ) : isSubmitting ? (
                  <><span className="material-symbols-outlined text-sm">hourglass_empty</span> 등록 중...</>
                ) : '작성 완료'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 미니홈피 설정 모달 — 별도 컴포넌트 */}
      {showSettings && (
        <MinihompySettingsModal
          main={main}
          onClose={() => setShowSettings(false)}
          onSaved={(updated) => { setMain(updated); setShowSettings(false) }}
        />
      )}

      {/* 프로필 사진 메뉴 */}
      {showProfileMenu && (
        <ProfileImageMenuModal
          onClose={() => setShowProfileMenu(false)}
          onChange={handleChangeProfile}
          onDelete={handleDeleteProfile}
        />
      )}

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
              TODAY <span className="text-[#ba1a1a]">{main?.visitorCount.today ?? 0}</span> | TOTAL {(main?.visitorCount.total ?? 0).toLocaleString()}
            </div>

            {/* 내 프로필 or 로그인 유도 */}
            {user ? (
              <div className="window-inset p-2 flex flex-col items-center gap-2">
                <div
                  className="w-full aspect-square border border-[#8e7164] bg-[#eeeeee] overflow-hidden flex items-center justify-center cursor-pointer hover:opacity-90 transition"
                  onClick={() => setShowProfileMenu(true)}
                >
                  {main?.profileImageUrl ? (
                    <img
                      src={main.profileImageUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span
                      className="material-symbols-outlined text-[80px] text-[#a33e00]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      face
                    </span>
                  )}
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
                </div>
                <div className="w-full text-center">
                  <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[20px] font-bold text-[#a33e00] mb-1">
                    {main?.title}
                  </h2>
                  <p className="text-[13px] font-semibold text-[#5a4136] bg-[#eeeeee] border-2 border-[#c9c9c9] rounded-lg p-3 min-h-[40px] flex items-center justify-center text-center">
                    {main?.introduction || '소개글이 없습니다'}
                  </p>
                </div>
                <div className="flex items-center gap-1 font-[Geist,monospace] text-[12px] font-semibold text-[#5a4136] w-full bg-[#f9f9f9] py-1 px-2 window-inset">
                  <span className="text-sm">{moodEmoji}</span>
                  오늘의 기분: {moodText || '알 수 없음'}
                </div>
                <div className="flex flex-col gap-1 w-full mt-auto">
                  <button className="retro-btn retro-btn-primary font-[Geist,monospace] text-[12px] font-semibold py-2 px-4 flex items-center justify-center gap-1"
                    onClick={() => navigate(`/`)}>
                    <span className="material-symbols-outlined text-base">home</span> 내 홈피 가기
                  </button>
                  <button className="retro-btn font-[Geist,monospace] text-[12px] font-semibold py-2 px-4 flex items-center justify-center gap-1"
                    onClick={openModal}>
                    <span className="material-symbols-outlined text-base">edit_note</span> 다이어리 쓰기
                  </button>
                  <button className="retro-btn font-[Geist,monospace] text-[12px] font-semibold py-2 px-4 flex items-center justify-center gap-1 text-[#ba1a1a]"
                    onClick={() => { clearAuth(); clearMain(); navigate('/auth/login') }}>
                    <span className="material-symbols-outlined text-base">logout</span> 로그아웃
                  </button>
                </div>
              </div>
            ) : (
              <div className="window-inset p-4 flex flex-col items-center gap-3">
                <span className="material-symbols-outlined text-[64px] text-[#a33e00]" style={{ fontVariationSettings: "'FILL' 1" }}>account_circle</span>
                <p className="font-[Geist,monospace] text-[12px] text-[#5a4136] text-center">로그인하고 일촌 소식을 확인하세요!</p>
                <button
                  className="retro-btn retro-btn-primary font-[Geist,monospace] text-[12px] font-semibold py-2 px-4 w-full flex items-center justify-center gap-1"
                  onClick={() => navigate('/auth/login')}
                >
                  <span className="material-symbols-outlined text-base">login</span> 로그인
                </button>
                <button
                  className="retro-btn font-[Geist,monospace] text-[12px] font-semibold py-2 px-4 w-full flex items-center justify-center gap-1"
                  onClick={() => navigate('/auth/signup')}
                >
                  <span className="material-symbols-outlined text-base">person_add</span> 회원가입
                </button>
              </div>
            )}

            {/* 접속 중인 일촌 + 일촌 관리 — 로그인 유저만 */}
            {user && (
              <>
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

                <button
                  className="retro-btn font-[Geist,monospace] text-[12px] font-semibold py-2 px-4 flex items-center justify-center gap-1"
                  onClick={() => navigate('/friends')}
                >
                  <span className="material-symbols-outlined text-base">group</span> 일촌 관리
                </button>
              </>
            )}
          </aside>

          {/* 피드 */}
          <main className="flex-1 flex flex-col gap-2 min-w-0">

            {/* BGM 바 */}
            <div className="window-frame p-1 bg-[#eeeeee] flex items-center justify-between">
              <div className="font-[Geist,monospace] text-[12px] font-bold text-[#1a1c1c]">홈 피드</div>
              <BgmPlayer
                main={main}
                onBgmChanged={(bgmUrl) => setMain(main ? { ...main, bgmUrl } : null)}
                onTrackNameChange={setCurrentTrackName}
              />
            </div>

            {/* 미니룸 프리뷰 */}
            <div className="window-inset border border-[#8e7164] overflow-hidden bg-white flex flex-col">
              <div className="bg-[#baeaff] px-2 py-1 border-b border-[#8e7164] font-[Geist,monospace] text-[12px] font-semibold text-[#09657f] flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">house</span>
                미니룸
                <span className="text-[#5a4136] font-normal ml-1">
                  {currentTrackName ? `· ${currentTrackName}` : ''}
                </span>
                <button className="retro-btn font-[Geist,monospace] text-[11px] font-semibold px-2 py-1 ml-auto flex items-center gap-1"
                  onClick={() => navigate('/room')}>
                  <span className="material-symbols-outlined text-[13px]">edit</span> 꾸미기
                </button>
              </div>
              <MiniroomFeedPreview room={roomPreview} nickname={user?.nickname} />
              <div className="hidden">
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

            {/* 글쓰기 트리거 */}
            <div
              className="window-inset border border-[#8e7164] bg-white p-2 flex gap-2 items-center cursor-pointer hover:bg-[#f3f3f3]"
              onClick={openModal}
            >
              <div className="w-8 h-8 flex-shrink-0 border border-[#8e7164] bg-[#eeeeee] overflow-hidden flex items-center justify-center">
                <span className="material-symbols-outlined text-xl text-[#a33e00]" style={{ fontVariationSettings: "'FILL' 1" }}>face</span>
              </div>
              <span className="window-inset flex-1 text-[14px] p-1 text-[#8e7164] font-[Geist,monospace]">
                오늘 어떤 하루였나요? 다이어리 써보세요...
              </span>
              <button className="retro-btn retro-btn-primary font-[Geist,monospace] text-[12px] font-semibold px-2 py-1">작성</button>
            </div>

            {/* 피드 필터 */}
            <div className="flex gap-1">
              {(['전체 피드', '일촌만', '사진만', '북마크'] as const).map((label, i) => {
                const val = (['전체', '일촌만', '사진만', '북마크'] as const)[i]
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
                <span className="material-symbols-outlined text-sm">{selectedTag ? 'tag' : 'dynamic_feed'}</span>
                {selectedTag ? (
                  <>
                    <span className="text-[#09657f]">#{selectedTag}</span> 검색 결과
                    <button onClick={clearTag} className="ml-auto flex items-center gap-0.5 text-[#5a4136] hover:text-[#ba1a1a]">
                      <span className="material-symbols-outlined text-sm">close</span>
                      <span className="text-[11px]">피드로 돌아가기</span>
                    </button>
                  </>
                ) : '일촌 소식'}
              </div>
              <div className="flex flex-col overflow-y-auto" style={{ maxHeight: 520 }}>
                {displayPosts.length === 0 && !loading && (
                  <div className="p-8 text-center font-[Geist,monospace] text-[12px] text-[#5a4136]">
                    {selectedTag && searchError
                      ? <span className="text-[#ba1a1a]">검색에 실패했어요. <button className="underline" onClick={() => loadSearch(selectedTag)}>다시 시도</button></span>
                      : selectedTag
                        ? `#${selectedTag} 태그가 달린 게시물이 없어요.`
                        : filter === '북마크'
                          ? '북마크한 게시물이 없어요.'
                          : '아직 피드가 없어요. 일촌을 추가해보세요!'}
                  </div>
                )}

                {displayPosts.map((post, idx) => {
                  const liked = likedPostIds.has(post.postId)
                  const bookmarked = bookmarkedPostIds.has(post.postId)
                  return (
                    <div key={post.postId} className={`p-2 flex flex-col gap-2${idx < displayPosts.length - 1 ? ' border-b border-[#e3bfb1]' : ''}`}>
                      <div className="flex gap-2 items-start">
                        <div className="w-10 h-10 flex-shrink-0 border border-[#8e7164] bg-[#eeeeee] overflow-hidden flex items-center justify-center">
                          <span className="material-symbols-outlined text-[28px] text-[#a33e00]" style={{ fontVariationSettings: "'FILL' 1" }}>face</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-1 mb-1">
                            <UserNameLink
                              userId={post.userId}
                              nickname={post.nickname}
                              className="font-[Geist,monospace] text-[12px] font-bold text-[#a33e00] cursor-pointer hover:underline"
                            />
                            <span className="bg-[#baeaff] text-[#09657f] font-[Geist,monospace] text-[10px] px-1 rounded">일촌</span>
                            <span className="text-[#5a4136] font-[Geist,monospace] text-[12px] ml-auto">{formatTime(post.createdAt)}</span>
                          </div>
                          {post.title && <h3 className="font-['Bricolage_Grotesque',sans-serif] text-[16px] font-bold text-[#1a1c1c] mb-1">{post.title}</h3>}
                          <p className="text-[14px] text-[#1a1c1c] leading-relaxed">{post.content ?? ''}</p>
                          {post.hashtags.length > 0 && (
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {post.hashtags.map(tag => (
                                <button
                                  key={tag}
                                  type="button"
                                  className="font-[Geist,monospace] text-[10px] text-[#0c6780] hover:underline"
                                  onClick={() => selectTag(tag)}
                                >#{tag}</button>
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
                        <button
                          className={`retro-btn font-[Geist,monospace] text-[12px] font-semibold px-2 py-1 flex items-center gap-1${openCommentIds.has(post.postId) ? ' retro-btn-primary' : ''}`}
                          onClick={() => toggleComments(post.postId)}
                        >
                          <span className="material-symbols-outlined text-sm">chat_bubble</span>
                          댓글 {post.commentCount}
                        </button>
                        <button
                          className="retro-btn font-[Geist,monospace] text-[12px] font-semibold px-2 py-1 flex items-center gap-1 ml-auto"
                          onClick={() => toggleBookmark(post.postId)}
                          disabled={pendingBookmarkIds.has(post.postId)}
                          aria-label={bookmarked ? '북마크 해제' : '북마크'}
                        >
                          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: bookmarked ? "'FILL' 1" : "'FILL' 0", color: bookmarked ? '#a33e00' : undefined }}>bookmark</span>
                        </button>
                        <button className="retro-btn font-[Geist,monospace] text-[12px] font-semibold px-2 py-1 flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">share</span>
                        </button>
                      </div>

                      {openCommentIds.has(post.postId) && (
                        <div className="ml-6 flex flex-col gap-1">
                          {commentLoading.has(post.postId) ? (
                            <p className="font-[Geist,monospace] text-[11px] text-[#5a4136] py-1">불러오는 중...</p>
                          ) : (postComments[post.postId] ?? []).length === 0 ? (
                            <p className="font-[Geist,monospace] text-[11px] text-[#5a4136] py-1">첫 댓글을 남겨보세요!</p>
                          ) : (
                            <div className="flex flex-col gap-1">
                              {(postComments[post.postId] ?? []).map(c => (
                                <div key={c.commentId} className={`flex gap-1 items-start py-1${c.parentCommentId ? ' ml-4' : ''}`}>
                                  {c.parentCommentId && <span className="material-symbols-outlined text-[13px] text-[#5a4136] mt-0.5">subdirectory_arrow_right</span>}
                                  <span className="font-[Geist,monospace] text-[11px] font-bold text-[#a33e00] shrink-0">{c.nickname}</span>
                                  <span className="font-[Geist,monospace] text-[11px] text-[#1a1c1c] flex-1">{c.content}</span>
                                  {user?.id === c.userId && (
                                    <button
                                      className="font-[Geist,monospace] text-[10px] text-[#ba1a1a] hover:underline shrink-0"
                                      onClick={() => deleteComment(post.postId, c.commentId)}
                                    >삭제</button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="flex gap-1 mt-1">
                            <input
                              className="window-inset flex-1 text-[12px] p-1 focus:outline-none"
                              type="text"
                              placeholder="댓글 달기..."
                              value={commentInputs[post.postId] ?? ''}
                              onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.postId]: e.target.value }))}
                              onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) submitComment(post.postId) }}
                            />
                            <button
                              className="retro-btn font-[Geist,monospace] text-[12px] font-semibold px-2 py-1"
                              onClick={() => submitComment(post.postId)}
                              disabled={commentSubmitting.has(post.postId)}
                            >등록</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}

                <div className="p-2 flex justify-center border-t border-[#e3bfb1]">
                  {(selectedTag ? searchHasNext : filter === '북마크' ? bookmarkHasNext : hasNext) ? (
                    <button
                      className="retro-btn font-[Geist,monospace] text-[12px] font-semibold px-12 py-2 flex items-center gap-1"
                      onClick={() => selectedTag ? loadSearch(selectedTag, searchCursor) : filter === '북마크' ? loadBookmarks(bookmarkCursor) : loadFeed(cursor)}
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
          {(() => {
            const tabs = [
              { icon: 'home', label: '홈', path: '/' },
              { icon: 'edit_note', label: '다이어리', path: `/home/${user?.id ?? 'me'}` },
              { icon: 'photo_library', label: '사진첩', path: `/home/${user?.id ?? 'me'}` },
              { icon: 'forum', label: '방명록', path: `/guestbook/${user?.id ?? 'me'}` },
              { icon: 'footprint', label: '방문자', path: `/visitor/${user?.id ?? 'me'}` },
              { icon: 'storefront', label: '상점', path: '/shop' },
            ]
            // 첫 번째 매칭 탭만 active → 동일 경로 탭 중복 active 방지
            const activeIndex = tabs.findIndex(t => location.pathname === t.path)
            return tabs.map((tab, index) => {
              const active = index === activeIndex
              return (
                <button key={tab.label}
                  onClick={() => navigate(tab.path)}
                  aria-current={active ? 'page' : undefined}
                  className={`tab-item${active ? ' tab-active' : ' bg-[#f3f3f3] text-[#5a4136] hover:bg-[#e2e2e2]'} py-2 px-1 text-center font-[Geist,monospace] text-[12px] font-semibold flex flex-col items-center gap-1 cursor-pointer border-none`}>
                  <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                  {tab.label}
                </button>
              )
            })
          })()}

          {/* 설정 버튼(프로필 사진, 배경화면, 소개글 등 설정) — 기존 탭 목록과 완전히 분리, 모달이라 path 필요없음 */}
          {main?.owner && (
            <button
              onClick={() => setShowSettings(true)}
              className="tab-item bg-[#f3f3f3] text-[#5a4136] hover:bg-[#e2e2e2] py-2 px-1 text-center font-[Geist,monospace] text-[12px] font-semibold flex flex-col items-center gap-1 cursor-pointer border-none"
            >
              <span className="material-symbols-outlined text-lg">settings</span>
              설정
            </button>
          )}
        </nav>
      </div>

    </div>
  )
}
