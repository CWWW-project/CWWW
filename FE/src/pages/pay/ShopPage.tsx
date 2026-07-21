import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cartApi } from '../../api/cart'
import { itemApi } from '../../api/item'
import { getBalance } from '../../api/payment'
import { useAuthStore } from '../../store/authStore'
import type { CartItemResponse, InventoryItemResponse, ItemResponse } from '../../types'
import AcornChargeModal from '../../components/AcornChargeModal'

type CategoryFilter = 'ALL' | 'MINIROOM_ITEM' | 'MINIROOM_BACKGROUND' | 'AVATAR' | 'BGM'

const CATEGORIES: Array<{ value: CategoryFilter; label: string; aliases: string[] }> = [
  { value: 'ALL', label: '전체', aliases: [] },
  { value: 'MINIROOM_ITEM', label: '미니룸 아이템', aliases: ['MINIROOM_ITEM', 'MINIROOM'] },
  { value: 'MINIROOM_BACKGROUND', label: '미니룸 배경', aliases: ['MINIROOM_BACKGROUND', 'BACKGROUND'] },
  { value: 'AVATAR', label: '미니미', aliases: ['AVATAR'] },
  { value: 'BGM', label: 'BGM', aliases: ['BGM'] },
]

const categoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    MINIROOM_ITEM: '미니룸 아이템',
    MINIROOM: '미니룸 아이템',
    MINIROOM_BACKGROUND: '미니룸 배경',
    BACKGROUND: '미니룸 배경',
    AVATAR: '미니미',
    BGM: 'BGM',
  }
  return labels[category] ?? category
}

const visualForCategory = (category: string) => {
  const map: Record<string, { icon: string; color: string; bg: string }> = {
    MINIROOM_ITEM: { icon: 'chair', color: '#8B4513', bg: '#fff9e6' },
    MINIROOM: { icon: 'chair', color: '#8B4513', bg: '#fff9e6' },
    MINIROOM_BACKGROUND: { icon: 'wallpaper', color: '#0c6780', bg: '#e8f4fb' },
    BACKGROUND: { icon: 'wallpaper', color: '#0c6780', bg: '#e8f4fb' },
    AVATAR: { icon: 'face', color: '#e91e63', bg: '#fce4ec' },
    BGM: { icon: 'music_note', color: '#a33e00', bg: '#f0f8ff' },
  }
  return map[category] ?? { icon: 'inventory_2', color: '#5a4136', bg: '#f3f3f3' }
}

export default function ShopPage() {
  const navigate = useNavigate()
  const authStore = useAuthStore()
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('ALL')
  const [items, setItems] = useState<ItemResponse[]>([])
  const [cart, setCart] = useState<CartItemResponse[]>([])
  const [inventory, setInventory] = useState<InventoryItemResponse[]>([])
  const [showPayment, setShowPayment] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [acorns, setAcorns] = useState<number | null>(null)
  const [chargeOpen, setChargeOpen] = useState(false)

  const inventoryItemIds = useMemo(() => new Set(inventory.map(item => item.itemId)), [inventory])
  const cartItemIds = useMemo(() => new Set(cart.map(item => item.itemId)), [cart])
  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0)

  const filteredItems = useMemo(() => {
    if (activeCategory === 'ALL') return items
    const category = CATEGORIES.find(item => item.value === activeCategory)
    return items.filter(item => category?.aliases.includes(item.category))
  }, [activeCategory, items])

  const loadShop = async () => {
    setLoading(true)
    setError(null)
    try {
      const itemsResponse = await itemApi.getItems(undefined, 1, 100)
      setItems(itemsResponse.data.data)

      if (!localStorage.getItem('accessToken')) {
        setCart([])
        setInventory([])
        setAcorns(null)
        return
      }

      const [cartResponse, inventoryResponse] = await Promise.all([
        cartApi.getCart(),
        itemApi.getInventory(),
      ])
      setCart(cartResponse.data.data)
      setInventory(inventoryResponse.data.data)
      setAcorns(null)
      try {
        const balanceResponse = await getBalance()
        setAcorns(balanceResponse.balance)
      } catch {
        setAcorns(null)
      }
    } catch {
      setError('상점 정보를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadShop()
  }, [])

  const addCart = async (itemId: number) => {
    setError(null)
    if (!localStorage.getItem('accessToken')) {
      setError('로그인 후 장바구니에 담을 수 있습니다.')
      return
    }
    try {
      const response = await cartApi.addItem(itemId)
      setCart(response.data.data)
    } catch {
      setError('이미 보유했거나 장바구니에 담긴 아이템입니다.')
    }
  }

  const removeCart = async (cartId: number) => {
    setError(null)
    try {
      await cartApi.removeItem(cartId)
      setCart(prev => prev.filter(item => item.cartId !== cartId))
    } catch {
      setError('장바구니 아이템을 삭제하지 못했습니다.')
    }
  }

  const clearCart = async () => {
    setError(null)
    try {
      await cartApi.clear()
      setCart([])
    } catch {
      setError('장바구니를 비우지 못했습니다.')
    }
  }

  const confirmPayment = async () => {
    setError(null)
    try {
      const response = await cartApi.purchase()
      const inventoryResponse = await itemApi.getInventory()
      setInventory(inventoryResponse.data.data)
      setCart([])
      setAcorns(response.data.data.remainingAcorns)
      setShowPayment(false)
      setToast('구매가 완료되었습니다.')
      setTimeout(() => setToast(null), 2500)
    } catch {
      setShowPayment(false)
      setError('구매에 실패했습니다. 도토리 잔액과 장바구니를 확인해주세요.')
    }
  }

  const isAdmin = authStore.user?.role === 'ADMIN'

  return (
    <div className="min-h-screen text-[#1a1c1c] py-6 flex justify-center items-start">
      <div className="max-w-[1100px] w-full mx-auto flex gap-0 relative z-10 px-2 md:px-0">
        <div className="window-frame p-4 w-full flex flex-col gap-4 border border-[#8e7164] relative">
          <div className="retro-title-bar -mx-4 -mt-4 mb-0">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>storefront</span>
            미니룸 상점
            <div className="flex gap-1 ml-auto">
              <button className="retro-btn px-2 py-1 text-[11px]" onClick={() => navigate('/home')}>🏠 미니홈피</button>
              {isAdmin && (
                <button className="retro-btn px-2 py-1 text-[11px]" onClick={() => navigate('/admin/payments')}>👮 관리자</button>
              )}
              <button className="retro-btn px-2 py-1 text-[11px]" onClick={() => void loadShop()}>새로고침</button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mt-2">
            <div className="flex-1 flex flex-col gap-2">
              <div className="window-inset p-2 flex items-center justify-between gap-2">
                <div className="font-[Geist,monospace] text-[12px] text-[#5a4136]">
                  {loading ? '불러오는 중...' : <>아이템 <span className="text-[#a33e00] font-bold">{filteredItems.length}</span>개</>}
                </div>
                <div className="flex items-center gap-1">
                  <div className="window-frame px-2 py-1 font-bold text-[#a33e00] text-sm">
                    보유 도토리 {acorns == null ? '-' : acorns.toLocaleString()}
                  </div>
                  <button
                    className="retro-btn retro-btn-primary px-2 py-1 text-[11px] font-semibold"
                    onClick={() => setChargeOpen(true)}
                  >
                    🌰 충전
                  </button>
                </div>
              </div>

              <div className="flex gap-1 flex-wrap">
                {CATEGORIES.map(category => (
                  <button
                    key={category.value}
                    onClick={() => setActiveCategory(category.value)}
                    className={`category-tab${activeCategory === category.value ? ' active' : ''}`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>

              <div className="window-inset p-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {filteredItems.map(item => {
                    const visual = visualForCategory(item.category)
                    const disabled = inventoryItemIds.has(item.itemId) || cartItemIds.has(item.itemId)
                    return (
                      <div key={item.itemId} className="item-card p-1 flex flex-col gap-1">
                        <div className="w-full aspect-square flex items-center justify-center border border-[#e3bfb1] relative" style={{ background: visual.bg }}>
                          {item.assetUrl ? (
                            <img src={item.assetUrl} alt="" className="max-w-[78%] max-h-[78%] object-contain" />
                          ) : (
                            <span className="material-symbols-outlined text-[40px]" style={{ fontVariationSettings: "'FILL' 1", color: visual.color }}>
                              {visual.icon}
                            </span>
                          )}
                          {inventoryItemIds.has(item.itemId) && (
                            <div className="absolute top-0 right-0 text-white text-[9px] px-1 bg-[#0c6780] font-[Geist,monospace]">보유중</div>
                          )}
                        </div>
                        <div className="font-[Geist,monospace] text-[12px] font-bold text-[#1a1c1c] truncate" title={item.name}>{item.name}</div>
                        <div className="flex items-center justify-between">
                          <span className="acorn-badge">{item.price}</span>
                          <span className="text-[10px] text-[#5a4136] font-[Geist,monospace]">{categoryLabel(item.category)}</span>
                        </div>
                        <button
                          className="retro-btn retro-btn-primary font-[Geist,monospace] text-[10px] font-semibold py-1"
                          onClick={() => void addCart(item.itemId)}
                          disabled={disabled}
                        >
                          {inventoryItemIds.has(item.itemId) ? '보유중' : cartItemIds.has(item.itemId) ? '담김' : '담기'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="w-full md:w-64 flex-shrink-0 flex flex-col gap-2">
              <div className="window-frame flex flex-col">
                <div className="retro-title-bar">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>shopping_cart</span>
                  장바구니 ({cart.length})
                </div>
                <div className="p-2 flex flex-col gap-1">
                  {cart.map(item => (
                    <div key={item.cartId} className="cart-item flex items-center justify-between pb-1">
                      <div className="flex flex-col min-w-0">
                        <span className="font-[Geist,monospace] text-[12px] font-bold text-[#1a1c1c] truncate">{item.name}</span>
                        <span className="acorn-badge mt-1 w-fit">{item.price}</span>
                      </div>
                      <button className="retro-btn px-1 py-1 text-[10px]" onClick={() => void removeCart(item.cartId)}>삭제</button>
                    </div>
                  ))}
                  {cart.length === 0 && (
                    <p className="text-[12px] text-[#5a4136] text-center py-2 font-[Geist,monospace]">장바구니가 비어 있습니다.</p>
                  )}
                </div>
                <div className="p-2 border-t border-[#e3bfb1]">
                  <div className="window-inset p-1 flex justify-between items-center mb-2">
                    <span className="font-[Geist,monospace] text-[12px] text-[#5a4136]">합계</span>
                    <span className="font-bold text-[#a33e00] text-lg">{cartTotal.toLocaleString()}</span>
                  </div>
                  <button
                    className="retro-btn retro-btn-primary w-full font-[Geist,monospace] text-[12px] font-semibold py-2 flex items-center justify-center gap-1"
                    onClick={() => setShowPayment(true)}
                    disabled={cart.length === 0}
                  >
                    <span className="material-symbols-outlined text-base">payments</span>
                    구매하기
                  </button>
                  <button className="retro-btn w-full font-[Geist,monospace] text-[12px] font-semibold py-2 mt-1" onClick={() => void clearCart()}>
                    비우기
                  </button>
                </div>
              </div>

              <div className="window-frame flex flex-col">
                <div className="retro-title-bar">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>inventory_2</span>
                  보유 아이템
                </div>
                <div className="p-2 flex flex-col gap-1">
                  {inventory.slice(0, 8).map(item => (
                    <div key={item.inventoryId} className="flex items-center gap-1 py-1 border-b border-[#e3bfb1] last:border-0">
                      <span className="font-[Geist,monospace] text-[12px] text-[#1a1c1c] flex-1 truncate">{item.name}</span>
                      <span className="text-[10px] text-[#5a4136] font-[Geist,monospace]">{categoryLabel(item.category)}</span>
                    </div>
                  ))}
                  {inventory.length === 0 && (
                    <p className="text-[12px] text-[#5a4136] text-center py-2 font-[Geist,monospace]">보유 아이템이 없습니다.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showPayment && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="window-frame p-0 w-80">
            <div className="retro-title-bar">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
              구매 확인
              <button className="title-btn ml-auto" onClick={() => setShowPayment(false)}>X</button>
            </div>
            <div className="p-4 flex flex-col gap-2">
              <div className="window-inset p-2">
                <div className="flex justify-between font-[Geist,monospace] text-[12px] mb-1">
                  <span className="text-[#5a4136]">아이템 수</span>
                  <span className="font-bold text-[#0c6780]">{cart.length}</span>
                </div>
                <div className="flex justify-between font-[Geist,monospace] text-[12px]">
                  <span className="text-[#5a4136]">합계</span>
                  <span className="font-bold text-[#a33e00]">{cartTotal.toLocaleString()}</span>
                </div>
              </div>
              <div className="text-[14px] text-[#5a4136] text-center">
                장바구니의 모든 아이템을 구매할까요?
              </div>
              <div className="flex gap-2">
                <button className="retro-btn flex-1 font-[Geist,monospace] text-[12px] font-semibold py-2" onClick={() => setShowPayment(false)}>취소</button>
                <button className="retro-btn retro-btn-primary flex-1 font-[Geist,monospace] text-[12px] font-semibold py-2" onClick={() => void confirmPayment()}>구매</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] window-frame px-4 py-2 font-[Geist,monospace] text-[12px] font-semibold text-[#1a1c1c] flex items-center gap-1">
          <span className="material-symbols-outlined text-base text-[#0c6780]">check_circle</span>
          {toast}
        </div>
      )}
      {error && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] window-frame px-4 py-2 font-[Geist,monospace] text-[12px] font-semibold text-[#ba1a1a] flex items-center gap-1">
          <span className="material-symbols-outlined text-base">error</span>
          {error}
        </div>
      )}

      <AcornChargeModal open={chargeOpen} onClose={() => setChargeOpen(false)} />
    </div>
  )
}