import { useState } from 'react'

interface CartItem {
  id: number
  name: string
  price: number
}

interface ShopItem {
  id: number
  name: string
  price: number
  icon: string
  iconColor: string
  bg: string
  category: string
  badge?: string
  badgeColor?: string
}

const SHOP_ITEMS: ShopItem[] = [
  { id: 1, name: '봄벚꽃 스킨', price: 500, icon: 'palette', iconColor: '#0c6780', bg: '#e8f4fb', category: '스킨', badge: 'NEW', badgeColor: 'var(--c-navy)' },
  { id: 2, name: '클래식 소파', price: 300, icon: 'chair', iconColor: '#8B4513', bg: '#fff9e6', category: '미니룸', badge: '인기', badgeColor: 'var(--c-mid)' },
  { id: 3, name: '프리스타일 - Y', price: 100, icon: 'music_note', iconColor: '#a33e00', bg: '#f0f8ff', category: 'BGM' },
  { id: 4, name: '하트 이펙트', price: 200, icon: 'favorite', iconColor: '#ba1a1a', bg: '#fef3f3', category: '아이템' },
  { id: 5, name: '레인보우 침대', price: 450, icon: 'bed', iconColor: '#7b3fe4', bg: '#f5f0ff', category: '미니룸' },
  { id: 6, name: '자연 배경 스킨', price: 600, icon: 'forest', iconColor: '#2e7d32', bg: '#f0fff0', category: '스킨' },
  { id: 7, name: '무드등 세트', price: 250, icon: 'light', iconColor: '#f59e0b', bg: '#fff8e1', category: '미니룸' },
  { id: 8, name: '핑크 미니미 세트', price: 800, icon: 'face', iconColor: '#e91e63', bg: '#fce4ec', category: '미니미' },
]

const CATEGORIES = ['전체', '🎨 스킨', '🏠 미니룸', '🎵 BGM', '🎁 아이템', '👤 미니미']

export default function ShopPage() {
  const [activeCategory, setActiveCategory] = useState('전체')
  const [cart, setCart] = useState<CartItem[]>([{ id: 1, name: '봄벚꽃 스킨', price: 500 }])
  const [nextId, setNextId] = useState(100)
  const [showPayment, setShowPayment] = useState(false)
  const [toast, setToast] = useState(false)
  const [acorns] = useState(2400)

  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0)

  const addCart = (e: React.MouseEvent, name: string, price: number) => {
    e.stopPropagation()
    setCart(prev => [...prev, { id: nextId, name, price }])
    setNextId(n => n + 1)
  }

  const removeCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id))
  }

  const confirmPayment = () => {
    setShowPayment(false)
    setCart([])
    setToast(true)
    setTimeout(() => setToast(false), 2500)
  }

  const filtered = activeCategory === '전체'
    ? SHOP_ITEMS
    : SHOP_ITEMS.filter(item => activeCategory.includes(item.category) || item.category === activeCategory.replace(/^[^\s]+\s/, ''))

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
                  <div className="flex items-center gap-1 px-2 py-1 rounded" style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, fontWeight: 600, background: 'var(--c-navy)', color: '#fff' }}>
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>spa</span>
                    내 도토리
                  </div>
                  <div className="window-frame px-2 py-1 font-bold text-lg" style={{ color: 'var(--c-navy)' }}>
                    {acorns.toLocaleString()} 개
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
                <div className="font-[Geist,monospace] text-[12px]" style={{ color: 'var(--c-sub)' }}>
                  총 <span className="font-bold" style={{ color: 'var(--c-navy)' }}>{filtered.length}</span>개 아이템
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
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {filtered.map(item => (
                    <div
                      key={item.id}
                      className="item-card p-1 flex flex-col gap-1 cursor-pointer"
                    >
                      <div className="w-full aspect-square flex items-center justify-center border border-[#e3bfb1] relative"
                        style={{ background: item.bg }}>
                        <span className="material-symbols-outlined text-[40px]"
                          style={{ fontVariationSettings: "'FILL' 1", color: item.iconColor }}>
                          {item.icon}
                        </span>
                        {item.badge && (
                          <div className="absolute top-0 right-0 text-white text-[9px] px-1"
                            style={{ background: item.badgeColor, fontFamily: 'Geist, monospace' }}>
                            {item.badge}
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
                          className="retro-btn retro-btn-primary flex-1 font-[Geist,monospace] text-[10px] font-semibold py-1"
                          onClick={(e) => addCart(e, item.name, item.price)}
                        >담기</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 페이지네이션 */}
              <div className="flex items-center justify-center gap-1">
                <button className="retro-btn font-[Geist,monospace] text-[12px] font-semibold px-2 py-1">◀</button>
                <button className="retro-btn retro-btn-primary font-[Geist,monospace] text-[12px] font-semibold px-2 py-1">1</button>
                <button className="retro-btn font-[Geist,monospace] text-[12px] font-semibold px-2 py-1">2</button>
                <button className="retro-btn font-[Geist,monospace] text-[12px] font-semibold px-2 py-1">3</button>
                <button className="retro-btn font-[Geist,monospace] text-[12px] font-semibold px-2 py-1">▶</button>
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
                    <div key={item.id} className="cart-item flex items-center justify-between pb-1">
                      <div className="flex flex-col">
                        <span className="font-[Geist,monospace] text-[12px] font-bold text-[#1a1c1c]">{item.name}</span>
                        <span className="acorn-badge mt-1" style={{ display: 'inline-block', width: 'fit-content' }}>🌰 {item.price}</span>
                      </div>
                      <button className="retro-btn px-1 py-1 text-[10px]" onClick={() => removeCart(item.id)}>✕</button>
                    </div>
                  ))}
                  {cart.length === 0 && (
                    <p className="text-[12px] text-[#5a4136] text-center py-2" style={{ fontFamily: 'Geist, monospace' }}>장바구니가 비었습니다</p>
                  )}
                </div>
                <div className="p-2 border-t border-[#e3bfb1]">
                  <div className="window-inset p-1 flex justify-between items-center mb-2">
                    <span className="font-[Geist,monospace] text-[12px]" style={{ color: 'var(--c-sub)' }}>합계</span>
                    <span className="font-bold text-lg" style={{ color: 'var(--c-navy)' }}>🌰 {cartTotal.toLocaleString()}</span>
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
                  보유 아이템
                </div>
                <div className="p-2 flex flex-col gap-1">
                  {[
                    { icon: 'music_note', color: '#0c6780', name: 'Y (Please Tell Me Why)', cat: 'BGM' },
                    { icon: 'chair', color: '#a33e00', name: '나무 책상', cat: '미니룸' },
                    { icon: 'palette', color: '#e91e63', name: '블루 기본 스킨', cat: '스킨' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-1 py-1 border-b border-[#e3bfb1] last:border-0">
                      <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1", color: item.color }}>{item.icon}</span>
                      <span className="font-[Geist,monospace] text-[12px] text-[#1a1c1c] flex-1">{item.name}</span>
                      <span className="text-[10px] text-[#5a4136]" style={{ fontFamily: 'Geist, monospace' }}>{item.cat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 도토리 충전 배너 */}
              <div className="window-inset p-2 text-center">
                <div className="font-[Geist,monospace] text-[12px] font-bold mb-1" style={{ color: 'var(--c-navy)' }}>도토리가 부족한가요?</div>
                <div className="text-[14px] mb-2" style={{ color: 'var(--c-sub)' }}>카드/계좌이체로 간편 충전</div>
                <button className="retro-btn retro-btn-primary w-full font-[Geist,monospace] text-[12px] font-semibold py-2">
                  🌰 도토리 충전하기
                </button>
              </div>
            </div>
          </div>

          {/* 푸터 */}
          <div className="mt-2 pt-2 text-center font-[Geist,monospace] text-[12px]" style={{ borderTop: '1px solid var(--c-card-border)', color: 'var(--c-sub)' }}>
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
                  <span style={{ color: 'var(--c-sub)' }}>보유 도토리</span>
                  <span className="font-bold" style={{ color: 'var(--c-mid)' }}>🌰 {acorns.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-[Geist,monospace] text-[12px] mb-1">
                  <span style={{ color: 'var(--c-sub)' }}>결제 금액</span>
                  <span className="font-bold" style={{ color: 'var(--c-navy)' }}>🌰 {cartTotal.toLocaleString()}</span>
                </div>
                <div className="pt-1 flex justify-between font-[Geist,monospace] text-[12px]" style={{ borderTop: '1px solid var(--c-card-border)' }}>
                  <span style={{ color: 'var(--c-sub)' }}>결제 후 잔액</span>
                  <span className="font-bold" style={{ color: 'var(--c-text)' }}>🌰 {(acorns - cartTotal).toLocaleString()}</span>
                </div>
              </div>
              <div className="text-[14px] text-[#5a4136] text-center">
                {cart.length}개 아이템을 구매합니다.<br />도토리로 결제하시겠습니까?
              </div>
              <div className="flex gap-2">
                <button className="retro-btn flex-1 font-[Geist,monospace] text-[12px] font-semibold py-2" onClick={() => setShowPayment(false)}>취소</button>
                <button className="retro-btn retro-btn-primary flex-1 font-[Geist,monospace] text-[12px] font-semibold py-2" onClick={confirmPayment}>결제하기</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 토스트 */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] window-frame px-4 py-2 font-[Geist,monospace] text-[12px] font-semibold flex items-center gap-1" style={{ color: 'var(--c-navy)' }}>
          <span className="material-symbols-outlined text-base" style={{ color: 'var(--c-mid)' }}>check_circle</span>
          구매가 완료되었습니다!
        </div>
      )}
    </div>
  )
}
