import { useState, useEffect } from 'react'
import { itemApi, type Item } from '../../api/item'

const CATEGORY_MAP: Record<string, string> = {
  '전체': '전체',
  '🎨 스킨': 'SKIN',
  '🏠 미니룸': 'MINI_ROOM',
  '🎵 BGM': 'BGM',
  '🎁 아이템': 'ITEM',
  '👤 미니미': 'MINI_ME',
}

const CATEGORIES = Object.keys(CATEGORY_MAP)

const CATEGORY_ICON_MAP: Record<string, { icon: string; color: string }> = {
  SKIN:      { icon: 'palette',    color: '#0c6780' },
  MINI_ROOM: { icon: 'chair',      color: '#8B4513' },
  BGM:       { icon: 'music_note', color: '#a33e00' },
  ITEM:      { icon: 'favorite',   color: '#ba1a1a' },
  MINI_ME:   { icon: 'face',       color: '#e91e63' },
}

function getItemIcon(category: string) {
  return CATEGORY_ICON_MAP[category] ?? { icon: 'category', color: '#5a4136' }
}

export default function ShopPage() {
  const [activeCategory, setActiveCategory] = useState('전체')
  const [items, setItems] = useState<Item[]>([])
  const [inventory, setInventory] = useState<Set<number>>(new Set())
  const [cart, setCart] = useState<Item[]>([])
  const [acorns, setAcorns] = useState(0)
  const [availableBalance, setAvailableBalance] = useState(0)
  const [showPayment, setShowPayment] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [purchasing, setPurchasing] = useState(false)
  const [loadingItems, setLoadingItems] = useState(true)

  useEffect(() => {
    Promise.all([
      itemApi.getItems(1, 50),
      itemApi.getInventory(),
      itemApi.getBalance(),
    ]).then(([itemsRes, inventoryRes, balanceRes]) => {
      setItems(itemsRes.data.data)
      setInventory(new Set(inventoryRes.data.data.map(i => i.itemId)))
      setAcorns(balanceRes.data.data.balance)
      setAvailableBalance(balanceRes.data.data.availableBalance)
    }).catch(() => {
      showToast('error', '데이터를 불러오지 못했습니다.')
    }).finally(() => {
      setLoadingItems(false)
    })
  }, [])

  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0)

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 2500)
  }

  const addCart = (e: React.MouseEvent, item: Item) => {
    e.stopPropagation()
    if (inventory.has(item.itemId)) return
    if (cart.some(c => c.itemId === item.itemId)) return
    setCart(prev => [...prev, item])
  }

  const removeCart = (itemId: number) => {
    setCart(prev => prev.filter(item => item.itemId !== itemId))
  }

  const confirmPayment = async () => {
    if (cart.length === 0 || purchasing) return
    setPurchasing(true)
    try {
      const res = await itemApi.purchaseItems(cart.map(i => i.itemId))
      const result = res.data.data
      setInventory(prev => {
        const next = new Set(prev)
        result.purchasedItems.forEach(i => next.add(i.itemId))
        return next
      })
      setAcorns(result.balance)
      setAvailableBalance(result.availableBalance)
      setCart([])
      setShowPayment(false)
      showToast('success', `${result.purchasedItems.length}개 아이템 구매 완료!`)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? '구매에 실패했습니다.'
      showToast('error', msg)
    } finally {
      setPurchasing(false)
    }
  }

  const filtered = activeCategory === '전체'
    ? items
    : items.filter(item => item.category === CATEGORY_MAP[activeCategory])

  return (
    <div className="min-h-screen text-[#1a1c1c] py-6 flex justify-center items-start">
      <div className="max-w-[1100px] w-full mx-auto flex gap-0 relative z-10 px-2 md:px-0">

        {/* Main Window */}
        <div className="window-frame p-4 w-full flex flex-col gap-4 border border-[#8e7164] relative">

          {/* Title Bar */}
          <div className="retro-title-bar -mx-4 -mt-4 mb-0">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>storefront</span>
            싸이월드 아이템 상점
            <div className="ml-auto flex gap-1">
              <div className="title-btn">_</div>
              <div className="title-btn">□</div>
              <div className="title-btn">✕</div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mt-2">

            {/* Left: Item Grid */}
            <div className="flex-1 flex flex-col gap-2">

              {/* 도토리 잔액 + 검색 */}
              <div className="window-inset p-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-[#8B4513] text-white px-2 py-1 rounded" style={{ fontFamily: 'Geist, monospace', fontSize: 12, fontWeight: 600 }}>
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>spa</span>
                    내 도토리
                  </div>
                  <div className="window-frame px-2 py-1 font-bold text-[#a33e00] text-lg">
                    {availableBalance.toLocaleString()} 개
                  </div>
                  <button className="retro-btn font-[Geist,monospace] text-[12px] font-semibold px-2 py-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">add_circle</span> 충전
                  </button>
                </div>
                <div className="window-inset flex items-center px-1 py-1">
                  <input className="bg-transparent focus:outline-none text-[14px] w-28 text-[#1a1c1c]" placeholder="아이템 검색..." />
                  <span className="material-symbols-outlined text-sm text-[#5a4136] cursor-pointer">search</span>
                </div>
              </div>

              {/* 카테고리 탭 */}
              <div className="flex gap-1 flex-wrap">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`category-tab${activeCategory === cat ? ' active' : ''}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* 정렬 */}
              <div className="flex items-center justify-between">
                <div className="font-[Geist,monospace] text-[12px] text-[#5a4136]">
                  총 <span className="text-[#a33e00] font-bold">{filtered.length}</span>개 아이템
                </div>
                <select className="window-inset font-[Geist,monospace] text-[12px] text-[#1a1c1c] px-1 py-1 focus:outline-none bg-white">
                  <option>최신순</option>
                  <option>인기순</option>
                  <option>낮은가격순</option>
                  <option>높은가격순</option>
                </select>
              </div>

              {/* 아이템 그리드 */}
              <div className="window-inset p-2">
                {loadingItems ? (
                  <div className="text-center py-8 font-[Geist,monospace] text-[12px] text-[#5a4136]">
                    불러오는 중...
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="text-center py-8 font-[Geist,monospace] text-[12px] text-[#5a4136]">
                    아이템이 없습니다.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {filtered.map(item => {
                      const { icon, color } = getItemIcon(item.category)
                      const owned = inventory.has(item.itemId)
                      const inCart = cart.some(c => c.itemId === item.itemId)
                      return (
                        <div
                          key={item.itemId}
                          className="item-card p-1 flex flex-col gap-1 cursor-pointer"
                        >
                          <div className="w-full aspect-square flex items-center justify-center border border-[#e3bfb1] relative"
                            style={{ background: '#f5f0eb' }}>
                            <span className="material-symbols-outlined text-[40px]"
                              style={{ fontVariationSettings: "'FILL' 1", color }}>
                              {icon}
                            </span>
                            {owned && (
                              <div className="absolute top-0 right-0 text-white text-[9px] px-1"
                                style={{ background: '#4caf50', fontFamily: 'Geist, monospace' }}>
                                보유
                              </div>
                            )}
                          </div>
                          <div className="font-[Geist,monospace] text-[12px] font-bold text-[#1a1c1c]">{item.name}</div>
                          <div className="flex items-center justify-between">
                            <span className="acorn-badge">🌰 {item.price}</span>
                            <span className="text-[10px] text-[#5a4136]" style={{ fontFamily: 'Geist, monospace' }}>{item.category}</span>
                          </div>
                          <div className="flex gap-1">
                            <button className="retro-btn flex-1 font-[Geist,monospace] text-[10px] font-semibold py-1">미리보기</button>
                            <button
                              className={`retro-btn flex-1 font-[Geist,monospace] text-[10px] font-semibold py-1${owned || inCart ? '' : ' retro-btn-primary'}`}
                              onClick={(e) => addCart(e, item)}
                              disabled={owned || inCart}
                            >
                              {owned ? '보유중' : inCart ? '담김' : '담기'}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right: 장바구니 + 패널 */}
            <div className="w-full md:w-64 flex-shrink-0 flex flex-col gap-2">

              {/* 장바구니 */}
              <div className="window-frame flex flex-col">
                <div className="retro-title-bar">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>shopping_cart</span>
                  장바구니 ({cart.length})
                </div>
                <div className="p-2 flex flex-col gap-1">
                  {cart.map(item => (
                    <div key={item.itemId} className="cart-item flex items-center justify-between pb-1">
                      <div className="flex flex-col">
                        <span className="font-[Geist,monospace] text-[12px] font-bold text-[#1a1c1c]">{item.name}</span>
                        <span className="acorn-badge mt-1" style={{ display: 'inline-block', width: 'fit-content' }}>🌰 {item.price}</span>
                      </div>
                      <button className="retro-btn px-1 py-1 text-[10px]" onClick={() => removeCart(item.itemId)}>✕</button>
                    </div>
                  ))}
                  {cart.length === 0 && (
                    <p className="text-[12px] text-[#5a4136] text-center py-2" style={{ fontFamily: 'Geist, monospace' }}>장바구니가 비었습니다</p>
                  )}
                </div>
                <div className="p-2 border-t border-[#e3bfb1]">
                  <div className="window-inset p-1 flex justify-between items-center mb-2">
                    <span className="font-[Geist,monospace] text-[12px] text-[#5a4136]">합계</span>
                    <span className="font-bold text-[#a33e00] text-lg">🌰 {cartTotal.toLocaleString()}</span>
                  </div>
                  <button
                    className="retro-btn retro-btn-primary w-full font-[Geist,monospace] text-[12px] font-semibold py-2 flex items-center justify-center gap-1"
                    onClick={() => setShowPayment(true)}
                    disabled={cart.length === 0}
                  >
                    <span className="material-symbols-outlined text-base">payments</span>
                    도토리로 구매
                  </button>
                  <button
                    className="retro-btn w-full font-[Geist,monospace] text-[12px] font-semibold py-2 mt-1 flex items-center justify-center gap-1"
                    onClick={() => setCart([])}
                  >
                    <span className="material-symbols-outlined text-base">delete_sweep</span>
                    전체 비우기
                  </button>
                </div>
              </div>

              {/* 보유 아이템 */}
              <div className="window-frame flex flex-col">
                <div className="retro-title-bar">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>inventory_2</span>
                  보유 아이템 ({inventory.size})
                </div>
                <div className="p-2 flex flex-col gap-1 max-h-48 overflow-y-auto">
                  {items.filter(i => inventory.has(i.itemId)).length === 0 ? (
                    <p className="text-[12px] text-[#5a4136] text-center py-2" style={{ fontFamily: 'Geist, monospace' }}>보유한 아이템이 없습니다</p>
                  ) : (
                    items.filter(i => inventory.has(i.itemId)).map(item => {
                      const { icon, color } = getItemIcon(item.category)
                      return (
                        <div key={item.itemId} className="flex items-center gap-1 py-1 border-b border-[#e3bfb1] last:border-0">
                          <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1", color }}>{icon}</span>
                          <span className="font-[Geist,monospace] text-[12px] text-[#1a1c1c] flex-1 truncate">{item.name}</span>
                          <span className="text-[10px] text-[#5a4136]" style={{ fontFamily: 'Geist, monospace' }}>{item.category}</span>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* 도토리 충전 배너 */}
              <div className="window-inset p-2 text-center">
                <div className="font-[Geist,monospace] text-[12px] font-bold text-[#1a1c1c] mb-1">도토리가 부족한가요?</div>
                <div className="text-[14px] text-[#5a4136] mb-2">카드/계좌이체로 간편 충전</div>
                <button className="retro-btn w-full font-[Geist,monospace] text-[12px] font-semibold py-2"
                  style={{ background: '#8B4513', color: '#fff' }}>
                  🌰 도토리 충전하기
                </button>
              </div>
            </div>
          </div>

          {/* 푸터 */}
          <div className="mt-2 pt-2 border-t border-[#e3bfb1] text-center font-[Geist,monospace] text-[12px] text-[#5a4136]">
            담당: 장수호 · PAY 도메인 · 도토리 결제 / 상점 / 아이템 구매
          </div>
        </div>

        {/* 우측 탭 */}
        <nav className="hidden md:flex flex-col gap-1 w-16 pt-12 relative -ml-[2px] z-0">
          {[
            { icon: 'home', label: '홈' },
            { icon: 'edit_note', label: '다이어리' },
            { icon: 'photo_library', label: '사진첩' },
            { icon: 'forum', label: '방명록' },
            { icon: 'storefront', label: '상점', active: true },
          ].map(tab => (
            <div key={tab.label}
              className={`tab-item${tab.active ? ' tab-active' : ' bg-[#f3f3f3] text-[#5a4136] hover:bg-[#e2e2e2]'} py-2 px-1 text-center font-[Geist,monospace] text-[12px] font-semibold flex flex-col items-center gap-1`}>
              <span className="material-symbols-outlined text-lg">{tab.icon}</span>
              {tab.label}
            </div>
          ))}
        </nav>
      </div>

      {/* 결제 모달 */}
      {showPayment && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="window-frame p-0 w-80">
            <div className="retro-title-bar">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
              도토리 결제 확인
              <div className="ml-auto flex gap-1">
                <div className="title-btn" onClick={() => setShowPayment(false)}>✕</div>
              </div>
            </div>
            <div className="p-4 flex flex-col gap-2">
              <div className="window-inset p-2">
                <div className="flex justify-between font-[Geist,monospace] text-[12px] mb-1">
                  <span className="text-[#5a4136]">사용 가능 도토리</span>
                  <span className="font-bold text-[#0c6780]">🌰 {availableBalance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-[Geist,monospace] text-[12px] mb-1">
                  <span className="text-[#5a4136]">결제 금액</span>
                  <span className="font-bold text-[#a33e00]">🌰 {cartTotal.toLocaleString()}</span>
                </div>
                <div className="border-t border-[#e3bfb1] pt-1 flex justify-between font-[Geist,monospace] text-[12px]">
                  <span className="text-[#5a4136]">결제 후 잔액</span>
                  <span className={`font-bold ${availableBalance - cartTotal < 0 ? 'text-[#ba1a1a]' : 'text-[#1a1c1c]'}`}>
                    🌰 {(availableBalance - cartTotal).toLocaleString()}
                  </span>
                </div>
              </div>
              {availableBalance < cartTotal && (
                <div className="text-[12px] text-[#ba1a1a] text-center font-[Geist,monospace]">
                  도토리가 부족합니다. 충전 후 다시 시도하세요.
                </div>
              )}
              <div className="text-[14px] text-[#5a4136] text-center">
                {cart.length}개 아이템을 구매합니다.<br />도토리로 결제하시겠습니까?
              </div>
              <div className="flex gap-2">
                <button className="retro-btn flex-1 font-[Geist,monospace] text-[12px] font-semibold py-2" onClick={() => setShowPayment(false)}>취소</button>
                <button
                  className="retro-btn retro-btn-primary flex-1 font-[Geist,monospace] text-[12px] font-semibold py-2"
                  onClick={confirmPayment}
                  disabled={purchasing || availableBalance < cartTotal}
                >
                  {purchasing ? '처리 중...' : '결제하기'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 토스트 */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] window-frame px-4 py-2 font-[Geist,monospace] text-[12px] font-semibold text-[#1a1c1c] flex items-center gap-1">
          <span className={`material-symbols-outlined text-base ${toast.type === 'success' ? 'text-[#0c6780]' : 'text-[#ba1a1a]'}`}>
            {toast.type === 'success' ? 'check_circle' : 'error'}
          </span>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
