export interface ApiResponse<T> {
  code: string
  message: string
  data: T
}

export interface PostResponse {
  postId: number
  userId: number
  nickname: string
  minihompyId: number | null
  title: string | null
  content: string | null
  visibility: 'ALL' | 'FRIEND' | 'PRIVATE'
  viewCount: number
  likeCount: number
  commentCount: number
  isLiked: boolean
  hashtags: string[]
  mediaUrls: string[]
  createdAt: string
  updatedAt: string
}

export interface FeedResponse {
  posts: PostResponse[]
  nextCursor: number | null
  hasNext: boolean
}

export interface CommentResponse {
  commentId: number
  postId: number
  userId: number
  nickname: string
  parentCommentId: number | null
  content: string
  createdAt: string
}

export interface FriendResponse {
  friendId: number
  requesterId: number
  receiverId: number
  status: 'PENDING' | 'ACCEPTED'
  requesterAlias: string | null
  receiverAlias: string | null
  createdAt: string
  acceptedAt: string | null
}
