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
  isBookmarked: boolean
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
  opponentNickname: string
  createdAt: string
  acceptedAt: string | null
}

export interface UserSearchResponse {
  userId: number
  nickname: string
}

export interface ItemResponse {
  itemId: number
  category: string
  name: string
  description: string | null
  price: number
  status: string
  salesCount: number
  creatorId: number | null
  assetKey: string | null
  assetUrl: string | null
  assetWidth: number | null
  assetHeight: number | null
  placementType: string | null
}

export interface InventoryItemResponse {
  inventoryId: number
  itemId: number
  category: string
  name: string
  description: string | null
  price: number
  assetKey: string | null
  assetUrl: string | null
  assetWidth: number | null
  assetHeight: number | null
  placementType: string | null
  acquiredAt: string
}

export interface PurchaseResponse {
  purchaseId: number
  inventoryId: number
  remainingAcorns?: number
}

export interface CartItemResponse {
  cartId: number
  itemId: number
  category: string
  name: string
  description: string | null
  price: number
  assetKey: string | null
  assetUrl: string | null
  assetWidth: number | null
  assetHeight: number | null
  placementType: string | null
  createdAt: string
}

export interface CartPurchaseResponse {
  totalPrice: number
  remainingAcorns: number
  purchasedItems: PurchaseResponse[]
}

export interface AvatarResponse {
  avatarId: number
  avatarInventoryId: number | null
  posX: number | null
  posY: number | null
  scale: number | null
  flipped: boolean | null
}

export interface RoomItemResponse {
  roomItemId: number
  userInventoryId: number
  itemId: number
  category: string
  name: string
  description: string | null
  assetKey: string | null
  assetUrl: string | null
  assetWidth: number | null
  assetHeight: number | null
  placementType: string | null
  posX: number
  posY: number
  rotation: number
  flipped: boolean
  scale: number
  sortOrder: number
  locked: boolean
}

export interface RoomResponse {
  roomId: number
  userId: number
  backgroundInventoryId: number | null
  backgroundAssetKey: string | null
  backgroundAssetUrl: string | null
  maxItemCount: number
  layoutVersion: number
  avatar: AvatarResponse | null
  items: RoomItemResponse[]
}

export interface SaveRoomItemRequest {
  userInventoryId: number
  posX: number
  posY: number
  rotation?: number
  flipped?: boolean
  scale?: number
  sortOrder?: number
  locked?: boolean
}

export interface SaveRoomRequest {
  backgroundInventoryId?: number | null
  backgroundAssetKey?: string | null
  backgroundAssetUrl?: string | null
  avatar?: {
    avatarInventoryId?: number | null
    posX?: number | null
    posY?: number | null
    scale?: number | null
    flipped?: boolean | null
  } | null
  items: SaveRoomItemRequest[]
}

export interface VisitorCount {
  today: number
  total: number
}

export type AccessLevel = 'ALL' | 'FRIEND' | 'PRIVATE'

export interface MinihompyMainResponse {
  ownerId: number
  nickname: string
  profileImageUrl: string | null
  title: string
  introduction: string
  mood: string | null
  accessLevel: AccessLevel
  createdAt: string
  bgmUrl: string | null
  backgroundColor: string | null
  backgroundImageUrl: string | null
  owner: boolean
  visitorCount: VisitorCount
}

export interface BgmOptionResponse {
  itemId: number
  name: string        // "제목 - 아티스트"
  mediaUrl: string
  applied: boolean
}

export interface BgmApplyResponse {
  itemId: number | null
  mediaUrl: string | null
}

export interface ProfileImageResponse {
  profileImageUrl: string
}

export interface BackgroundResponse {
  value: string
}

export interface BackgroundDotOptionResponse {
  code: string
  hex: string
}

export interface GuestbookResponse {
  guestbookId: number
  writerId: number
  writerNickname: string
  content: string | null   // 비밀글이고 볼 권한 없으면 null
  visible: boolean         // 지금 요청자가 content를 볼 수 있는지
  isSecret: boolean        // @JsonProperty("isSecret") 그대로 매핑
  canEdit: boolean
  canDelete: boolean
  createdAt: string
  updatedAt: string
}

export interface GuestbookFeedResponse {
  guestbooks: GuestbookResponse[]
  nextCursor: number | null
  hasNext: boolean
}