import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { postApi } from '../../api/post'
import { commentApi } from '../../api/comment'
import type { PostResponse, CommentResponse } from '../../types'
import { useAuthStore } from '../../store/authStore'
import UserNameLink from '../../components/UserNameLink'

function formatTime(iso: string): string {
  const d = new Date(iso)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${mm}.${dd} ${hh}:${min}`
}

type Visibility = 'ALL' | 'FRIEND' | 'PRIVATE'
const VISIBILITY_LABELS: Record<Visibility, string> = { ALL: '전체공개', FRIEND: '일촌공개', PRIVATE: '비공개' }

interface DiaryForm {
  title: string
  content: string
  visibility: Visibility
  hashtags: string[]
  mediaUrls: string[]
}

const EMPTY_FORM: DiaryForm = { title: '', content: '', visibility: 'ALL', hashtags: [], mediaUrls: [] }

export default function DiaryPage() {
  const { userId: userIdParam } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const targetUserId = Number(userIdParam)
  const isOwner = !!user && user.id === targetUserId

  const [posts, setPosts] = useState<PostResponse[]>([])
  const [cursor, setCursor] = useState<number | undefined>(undefined)
  const [hasNext, setHasNext] = useState(false)
  const [loading, setLoading] = useState(false)
  const [initialLoaded, setInitialLoaded] = useState(false)

  const [likedPostIds, setLikedPostIds] = useState<Set<number>>(new Set())
  const [pendingLikeIds, setPendingLikeIds] = useState<Set<number>>(new Set())
  const [bookmarkedPostIds, setBookmarkedPostIds] = useState<Set<number>>(new Set())
  const [pendingBookmarkIds, setPendingBookmarkIds] = useState<Set<number>>(new Set())

  const [openCommentIds, setOpenCommentIds] = useState<Set<number>>(new Set())
  const [postComments, setPostComments] = useState<Record<number, CommentResponse[]>>({})
  const [commentLoading, setCommentLoading] = useState<Set<number>>(new Set())
  const [commentSubmitting, setCommentSubmitting] = useState<Set<number>>(new Set())
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({})

  // 작성/수정 공용 모달
  const [showModal, setShowModal] = useState(false)
  const [editingPostId, setEditingPostId] = useState<number | null>(null)
  const [form, setForm] = useState<DiaryForm>(EMPTY_FORM)
  const [tagInput, setTagInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const isEditMode = editingPostId !== null

  // ---------------------------------------------------------------------
  // 조회: 내 글 목록 (owner) — /feed에서 내 글만 필터링해서 모음
  // 백엔드에 "특정 유저 글 목록" 엔드포인트가 없어서, 피드를 여러 페이지
  // 순회하며 내 글만 걸러낸다.
  // ---------------------------------------------------------------------
  const loadMyPosts = useCallback(async (cursorParam?: number) => {
    setLoading(true)
    try {
      let nextCursor = cursorParam
      let more = true
      let collected: PostResponse[] = []
      let attempts = 0

      while (attempts < 3) {
        const res = await postApi.getFeed(nextCursor)
        const { posts: pagePosts, nextCursor: newCursor, hasNext: pageHasNext } = res.data.data
        const mine = pagePosts.filter((p: PostResponse) => p.userId === targetUserId)
        collected = [...collected, ...mine]
        nextCursor = newCursor ?? undefined
        more = pageHasNext
        attempts += 1
        if (!more || collected.length > 0) break
      }

      setPosts(prev => cursorParam !== undefined ? [...prev, ...collected] : collected)
      setCursor(nextCursor)
      setHasNext(more)
      const liked = new Set(collected.filter(p => p.isLiked).map(p => p.postId))
      setLikedPostIds(prev => cursorParam !== undefined ? new Set([...prev, ...liked]) : liked)
      const bookmarked = new Set(collected.filter(p => p.isBookmarked).map(p => p.postId))
      setBookmarkedPostIds(prev => cursorParam !== undefined ? new Set([...prev, ...bookmarked]) : bookmarked)
    } catch (e) {
      console.error('다이어리 로드 실패', e)
    } finally {
      setLoading(false)
      setInitialLoaded(true)
    }
  }, [targetUserId])

  // ---------------------------------------------------------------------
  // 조회: 남의 글 목록 (guest)
  // ---------------------------------------------------------------------
  const requestIdRef = useRef(0)

  const loadUserPosts = useCallback(async (cursorParam?: number) => {
    const requestId = ++requestIdRef.current

    setLoading(true)

    try {
      const res = await postApi.getUserPosts(targetUserId, cursorParam)
      const { posts: newPosts, nextCursor, hasNext: more } = res.data.data
      if (requestId !== requestIdRef.current) {
        return
      }
      setPosts(prev =>
        cursorParam !== undefined ? [...prev, ...newPosts] : newPosts
      )
      setCursor(nextCursor ?? undefined)
      setHasNext(more)
      const liked = new Set(newPosts.filter(p => p.isLiked).map(p => p.postId))
      setLikedPostIds(prev =>
        cursorParam !== undefined ? new Set([...prev, ...liked]) : liked
      )
      const bookmarked = new Set(newPosts.filter(p => p.isBookmarked).map(p => p.postId))
      setBookmarkedPostIds(prev =>
        cursorParam !== undefined ? new Set([...prev, ...bookmarked]) : bookmarked
      )
    } catch (e) {
      if (requestId !== requestIdRef.current) return
      console.error('다이어리 로드 실패', e)
      setPosts([])
      setHasNext(false)
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false)
        setInitialLoaded(true)
      }
    }
  }, [targetUserId])

  useEffect(() => {
    requestIdRef.current++
    setPosts([])
    setCursor(undefined)
    setInitialLoaded(false)
    if (!Number.isFinite(targetUserId)) return
    if (isOwner) loadMyPosts()
    else loadUserPosts()
  }, [targetUserId, isOwner, loadMyPosts, loadUserPosts])

  // ---------------------------------------------------------------------
  // 좋아요 (FeedPage의 toggleLike 그대로)
  // ---------------------------------------------------------------------
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
      setPosts(prev => prev.map(p => p.postId === postId ? { ...p, likeCount: p.likeCount + delta } : p))
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
      setPendingLikeIds(prev => { const next = new Set(prev); next.delete(postId); return next })
    }
  }

  // ---------------------------------------------------------------------
  // 북마크 (FeedPage의 toggleBookmark 단순화 — 여기선 목록에서 즉시 제거 안 함)
  // ---------------------------------------------------------------------
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
      if (bookmarked) await postApi.unbookmark(postId)
      else await postApi.bookmark(postId)
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

  // ---------------------------------------------------------------------
  // 댓글 (FeedPage 로직 그대로)
  // ---------------------------------------------------------------------
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
      setPosts(prev => prev.map(p => p.postId === postId ? { ...p, commentCount: p.commentCount + 1 } : p))
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
      setPosts(prev => prev.map(p => p.postId === postId ? { ...p, commentCount: Math.max(0, p.commentCount - 1) } : p))
    } catch {
      // 조용히 실패
    }
  }

  // ---------------------------------------------------------------------
  // 작성 / 수정 모달
  // ---------------------------------------------------------------------
  const openWriteModal = () => {
    setEditingPostId(null)
    setForm(EMPTY_FORM)
    setTagInput('')
    setImageFiles([])
    setImagePreviews([])
    setSubmitError('')
    setShowModal(true)
  }

  const openEditModal = (post: PostResponse) => {
    setEditingPostId(post.postId)
    setForm({
      title: post.title ?? '',
      content: post.content ?? '',
      visibility: post.visibility as Visibility,
      hashtags: post.hashtags ?? [],
      mediaUrls: post.mediaUrls ?? [],
    })
    setTagInput('')
    setImageFiles([])
    setImagePreviews([])
    setSubmitError('')
    setShowModal(true)
  }

  const closeModal = () => {
    if (isSubmitting || isUploading) return
    imagePreviews.forEach(url => URL.revokeObjectURL(url))
    setImageFiles([])
    setImagePreviews([])
    setSubmitError('')
    setShowModal(false)
    setEditingPostId(null)
  }

  const addTag = () => {
    const tag = tagInput.trim().replace(/^#/, '')
    if (!tag || form.hashtags.includes(tag)) { setTagInput(''); return }
    if (tag.length > 50 || form.hashtags.length >= 30) { setTagInput(''); return }
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

  const submitForm = async () => {
    if (!form.content.trim() || isSubmitting) return
    setIsSubmitting(true)
    setSubmitError('')
    try {
      if (isEditMode && editingPostId !== null) {
        // PostUpdateRequest엔 mediaUrls가 없어 사진 교체는 백엔드 미지원
        await postApi.updatePost(editingPostId, {
          title: form.title.trim(),
          content: form.content.trim(),
          visibility: form.visibility,
          hashtags: form.hashtags,
        })
        setPosts(prev => prev.map(p => p.postId === editingPostId
          ? { ...p, title: form.title.trim(), content: form.content.trim(), visibility: form.visibility, hashtags: form.hashtags }
          : p))
      } else {
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
      }
      imagePreviews.forEach(url => URL.revokeObjectURL(url))
      setShowModal(false)
      setEditingPostId(null)
    } catch (e: any) {
      setSubmitError(e.response?.data?.message ?? '저장에 실패했습니다. 다시 시도해주세요.')
      setIsUploading(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const deletePost = async (postId: number) => {
    if (!window.confirm('이 다이어리 글을 삭제할까요? 삭제한 글은 복구할 수 없습니다.')) return
    const prevPosts = posts
    setPosts(prev => prev.filter(p => p.postId !== postId))
    try {
      await postApi.deletePost(postId)
    } catch (e) {
      console.error('삭제 실패', e)
      alert('삭제에 실패했습니다. 다시 시도해주세요.')
      setPosts(prevPosts)
    }
  }

  const loadMore = () => {
    if (isOwner) loadMyPosts(cursor)
    else loadUserPosts(cursor)
  }

  return (
    <div className="min-h-screen text-[#1a1c1c] py-6 flex justify-center items-start">

      {/* 작성/수정 모달 */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-2">
          <div className="window-frame bg-[#f9f9f9] w-full max-w-lg flex flex-col" style={{ maxHeight: '90vh' }}>
            <div className="bg-[#e2e2e2] px-3 py-2 border-b-2 border-[#8e7164] flex items-center gap-2 flex-shrink-0">
              <span className="material-symbols-outlined text-sm text-[#a33e00]">edit_note</span>
              <span className="font-[Geist,monospace] text-[13px] font-bold text-[#1a1c1c]">
                {isEditMode ? '다이어리 수정' : '다이어리 쓰기'}
              </span>
              <button className="ml-auto retro-btn p-1" onClick={closeModal} disabled={isSubmitting}>
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-3 flex flex-col gap-3">
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

              {!isEditMode && (
                <div className="flex flex-col gap-1">
                  <label className="font-[Geist,monospace] text-[12px] font-semibold text-[#5a4136]">사진 첨부 <span className="text-[#5a4136] font-normal">(최대 5장)</span></label>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
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
                          <button className="absolute top-0 right-0 bg-[#ba1a1a] text-white rounded-bl" onClick={() => removeImage(idx)}>
                            <span className="material-symbols-outlined text-[14px] leading-none p-0.5">close</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {isEditMode && form.mediaUrls.length > 0 && (
                <div className="flex flex-col gap-1">
                  <label className="font-[Geist,monospace] text-[12px] font-semibold text-[#5a4136]">기존 사진 <span className="text-[#5a4136] font-normal">(수정 시 교체 불가)</span></label>
                  <div className="flex gap-2 flex-wrap">
                    {form.mediaUrls.map(url => (
                      <img key={url} src={url} alt="" className="w-20 h-20 object-cover border border-[#8e7164]" />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {submitError && (
              <p className="px-3 py-1 font-[Geist,monospace] text-[12px] text-[#ba1a1a] border-t border-[#8e7164]">{submitError}</p>
            )}

            <div className="px-3 py-2 border-t border-[#8e7164] flex gap-2 flex-shrink-0">
              <button className="retro-btn font-[Geist,monospace] text-[12px] font-semibold px-4 py-2 flex-1" onClick={closeModal} disabled={isSubmitting}>취소</button>
              <button
                className="retro-btn retro-btn-primary font-[Geist,monospace] text-[12px] font-semibold px-4 py-2 flex-1 flex items-center justify-center gap-1"
                onClick={submitForm}
                disabled={isSubmitting || !form.content.trim()}
              >
                {isUploading ? (
                  <><span className="material-symbols-outlined text-sm animate-spin">autorenew</span> 업로드 중...</>
                ) : isSubmitting ? (
                  <><span className="material-symbols-outlined text-sm">hourglass_empty</span> 저장 중...</>
                ) : (isEditMode ? '수정 완료' : '작성 완료')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[900px] w-full mx-auto px-2">
        <div className="window-frame p-4 flex flex-col gap-3 border border-[#8e7164]">

          <div className="flex items-center justify-between">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[20px] font-bold text-[#a33e00] flex items-center gap-1">
              <span className="material-symbols-outlined">edit_note</span>
              다이어리
            </h2>
            {isOwner && (
              <button className="retro-btn retro-btn-primary font-[Geist,monospace] text-[12px] font-semibold px-3 py-2 flex items-center gap-1" onClick={openWriteModal}>
                <span className="material-symbols-outlined text-base">add</span> 글쓰기
              </button>
            )}
          </div>

          {/* 일촌 소식 스타일 포스트 목록 — FeedPage와 동일한 카드 구조 */}
          <div className="window-inset border border-[#8e7164] flex-1 flex flex-col bg-white">
            <div className="bg-[#e2e2e2] px-2 py-1 border-b border-[#8e7164] font-[Geist,monospace] text-[12px] font-semibold text-[#1a1c1c] flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">dynamic_feed</span>
              {isOwner ? '내가 쓴 다이어리' : '다이어리'}
            </div>

            <div className="flex flex-col overflow-y-auto" style={{ maxHeight: 640 }}>
              {posts.length === 0 && !loading && initialLoaded && (
                <div className="p-8 text-center font-[Geist,monospace] text-[12px] text-[#5a4136]">
                  {isOwner ? '아직 작성한 다이어리가 없어요. 첫 글을 남겨보세요!' : '아직 작성한 다이어리가 없어요.'}
                </div>
              )}

              {posts.map((post, idx) => {
                const liked = likedPostIds.has(post.postId)
                const bookmarked = bookmarkedPostIds.has(post.postId)
                return (
                  <div key={post.postId} className={`p-2 flex flex-col gap-2${idx < posts.length - 1 ? ' border-b border-[#e3bfb1]' : ''}`}>
                    <div className="flex gap-2 items-start">
                      <div className="w-10 h-10 flex-shrink-0 border border-[#8e7164] bg-[#eeeeee] overflow-hidden flex items-center justify-center">
                        {post.profileImageUrl ? (
                          <img src={post.profileImageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-[28px] text-[#a33e00]" style={{ fontVariationSettings: "'FILL' 1" }}>face</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-1 mb-1">
                          <UserNameLink
                            userId={post.userId}
                            nickname={post.nickname}
                            className="font-[Geist,monospace] text-[12px] font-bold text-[#a33e00] cursor-pointer hover:underline"
                          />
                          <span className="bg-[#baeaff] text-[#09657f] font-[Geist,monospace] text-[10px] px-1 rounded">
                            {VISIBILITY_LABELS[post.visibility as Visibility]}
                          </span>
                          <span className="text-[#5a4136] font-[Geist,monospace] text-[12px] ml-auto">{formatTime(post.createdAt)}</span>
                        </div>
                        {post.title && <h3 className="font-['Bricolage_Grotesque',sans-serif] text-[16px] font-bold text-[#1a1c1c] mb-1">{post.title}</h3>}
                        <p className="text-[14px] text-[#1a1c1c] leading-relaxed whitespace-pre-wrap">{post.content ?? ''}</p>
                        {post.hashtags.length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {post.hashtags.map(tag => (
                              <span key={tag} className="font-[Geist,monospace] text-[10px] text-[#0c6780]">#{tag}</span>
                            ))}
                          </div>
                        )}
                        {post.mediaUrls.length > 0 && (
                          <div className="mt-2 flex flex-col items-start gap-1">
                            {post.mediaUrls.map(url => (
                              <img
                                key={url}
                                src={url}
                                alt=""
                                className="shadow-sm"
                                style={{ width: 220, height: 'auto' }}
                              />
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
                      {isOwner && (
                        <>
                          <button
                            className="retro-btn font-[Geist,monospace] text-[12px] font-semibold px-2 py-1 flex items-center gap-1"
                            onClick={() => openEditModal(post)}
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                          </button>
                          <button
                            className="retro-btn font-[Geist,monospace] text-[12px] font-semibold px-2 py-1 flex items-center gap-1 text-[#ba1a1a]"
                            onClick={() => deletePost(post.postId)}
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </>
                      )}
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
                {hasNext ? (
                  <button
                    className="retro-btn font-[Geist,monospace] text-[12px] font-semibold px-12 py-2 flex items-center gap-1"
                    onClick={loadMore}
                    disabled={loading}
                  >
                    <span className="material-symbols-outlined text-base">{loading ? 'hourglass_empty' : 'expand_more'}</span>
                    {loading ? '로딩 중...' : '더 보기'}
                  </button>
                ) : (
                  loading && <span className="font-[Geist,monospace] text-[12px] text-[#5a4136]">로딩 중...</span>
                )}
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