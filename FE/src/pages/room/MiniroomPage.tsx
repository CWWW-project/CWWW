import { useState, useRef, useCallback } from 'react'

interface PlacedItem {
  id: number
  name: string
  icon: string
  color: string
  x: number
  y: number
  size: number
  flipped: boolean
  zIndex: number
  visible: boolean
}

interface InvItem {
  name: string
  icon: string
  color: string
}

const INVENTORY: Record<string, InvItem[]> = {
  가구: [
    { name: '소파', icon: 'weekend', color: '#5d4037' },
    { name: '책상', icon: 'table_bar', color: '#6d4c41' },
    { name: '침대', icon: 'bed', color: '#7b3fe4' },
    { name: '옷장', icon: 'door_sliding', color: '#455a64' },
    { name: 'TV', icon: 'tv', color: '#212121' },
    { name: '화분', icon: 'potted_plant', color: '#388e3c' },
    { name: '책장', icon: 'menu_book', color: '#a33e00' },
    { name: '의자', icon: 'chair', color: '#e91e63' },
    { name: '컴퓨터', icon: 'computer', color: '#0c6780' },
  ],
  조명: [
    { name: '무드등', icon: 'light', color: '#f59e0b' },
    { name: '스탠드', icon: 'lamp', color: '#ff8c00' },
    { name: '전등', icon: 'emoji_objects', color: '#ffd700' },
  ],
  소품: [
    { name: '액자', icon: 'image', color: '#795548' },
    { name: '시계', icon: 'watch', color: '#607d8b' },
    { name: '화병', icon: 'local_florist', color: '#e91e63' },
  ],
  아바타: [
    { name: '미니미', icon: 'face', color: '#a33e00' },
    { name: '고양이', icon: 'pets', color: '#ff8f00' },
  ],
}

const BG_OPTIONS = [
  { gradient: 'linear-gradient(to bottom, #d6eaf8 60%, #c4a882)', title: '기본' },
  { gradient: 'linear-gradient(to bottom, #fce4ec 60%, #f8bbd0)', title: '핑크' },
  { gradient: 'linear-gradient(to bottom, #e8f5e9 60%, #a5d6a7)', title: '그린' },
  { gradient: 'linear-gradient(to bottom, #fff8e1 60%, #ffecb3)', title: '옐로우' },
  { gradient: 'linear-gradient(to bottom, #ede7f6 60%, #ce93d8)', title: '퍼플' },
  { gradient: 'linear-gradient(to bottom, #212121 60%, #424242)', title: '다크' },
]

const DEFAULT_ITEMS: PlacedItem[] = [
  { id: 1, name: '미니미', icon: 'face', color: '#a33e00', x: 45, y: 38, size: 48, flipped: false, zIndex: 1, visible: true },
  { id: 2, name: 'TV', icon: 'tv', color: '#212121', x: 10, y: 36, size: 40, flipped: false, zIndex: 1, visible: true },
  { id: 3, name: '소파', icon: 'weekend', color: '#5d4037', x: 60, y: 35, size: 48, flipped: false, zIndex: 1, visible: true },
  { id: 4, name: '화분', icon: 'potted_plant', color: '#388e3c', x: 85, y: 36, size: 32, flipped: false, zIndex: 1, visible: true },
]

export default function MiniroomPage() {
  const [items, setItems] = useState<PlacedItem[]>(DEFAULT_ITEMS)
  const [nextId, setNextId] = useState(10)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [invTab, setInvTab] = useState('가구')
  const [bg, setBg] = useState(BG_OPTIONS[0].gradient)
  const [selectedBg, setSelectedBg] = useState(0)
  const [tool, setTool] = useState<'select' | 'move'>('select')
  const [size, setSize] = useState(48)
  const [toast, setToast] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [draggingInv, setDraggingInv] = useState<InvItem | null>(null)

  const canvasRef = useRef<HTMLDivElement>(null)
  const draggingItemRef = useRef<{ id: number; startX: number; startY: number; startLeft: number; startTop: number } | null>(null)

  const selectedItem = items.find(i => i.id === selectedId)

  const handleItemMouseDown = useCallback((e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    setSelectedId(id)
    const item = items.find(i => i.id === id)
    if (!item || !canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    draggingItemRef.current = { id, startX: e.clientX, startY: e.clientY, startLeft: item.x, startTop: item.y }

    const onMove = (mv: MouseEvent) => {
      const drag = draggingItemRef.current
      if (!drag || !canvasRef.current) return
      const r = canvasRef.current.getBoundingClientRect()
      const dx = ((mv.clientX - drag.startX) / r.width) * 100
      const dy = ((mv.clientY - drag.startY) / r.height) * 100
      setItems(prev => prev.map(i =>
        i.id === drag.id
          ? { ...i, x: Math.max(0, Math.min(90, drag.startLeft + dx)), y: Math.max(0, Math.min(90, drag.startTop + dy)) }
          : i
      ))
    }
    const onUp = () => {
      draggingItemRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    // suppress unused warning
    void rect
  }, [items])

  const placeItem = useCallback((inv: InvItem, x: number, y: number) => {
    const id = nextId
    setItems(prev => [...prev, { id, name: inv.name, icon: inv.icon, color: inv.color, x, y, size: 40, flipped: false, zIndex: 1, visible: true }])
    setSelectedId(id)
    setNextId(n => n + 1)
  }, [nextId])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (!draggingInv || !canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    placeItem(draggingInv, x, y)
    setDraggingInv(null)
  }, [draggingInv, placeItem])

  const deleteSelected = () => {
    if (!selectedId) return
    setItems(prev => prev.filter(i => i.id !== selectedId))
    setSelectedId(null)
  }

  const flipSelected = () => {
    if (!selectedId) return
    setItems(prev => prev.map(i => i.id === selectedId ? { ...i, flipped: !i.flipped } : i))
  }

  const bringForward = () => {
    if (!selectedId) return
    setItems(prev => prev.map(i => i.id === selectedId ? { ...i, zIndex: i.zIndex + 1 } : i))
  }

  const sendBackward = () => {
    if (!selectedId) return
    setItems(prev => prev.map(i => i.id === selectedId ? { ...i, zIndex: Math.max(0, i.zIndex - 1) } : i))
  }

  const toggleVisibility = (id: number) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, visible: !i.visible } : i))
  }

  const resizeSelected = (val: number) => {
    setSize(val)
    if (!selectedId) return
    setItems(prev => prev.map(i => i.id === selectedId ? { ...i, size: val } : i))
  }

  const saveRoom = () => {
    setToast(true)
    setTimeout(() => setToast(false), 2500)
  }

  return (
    <div className="min-h-screen text-[#1a1c1c] py-6 flex justify-center items-start">
      <div className="max-w-[1100px] w-full mx-auto flex gap-0 relative z-10 px-2 md:px-0">

        <div className="window-frame p-0 w-full flex flex-col border border-[#8e7164] relative overflow-hidden">

          {/* 타이틀바 */}
          <div className="retro-title-bar">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>house</span>
            홍길동의 미니룸 꾸미기 편집기
            <div className="ml-auto flex gap-2 items-center">
              <div className="title-btn">_</div>
              <div className="title-btn">□</div>
              <div className="title-btn">✕</div>
            </div>
          </div>

          {/* 도구 모음 */}
          <div className="window-frame p-1 flex items-center gap-1 flex-wrap border-b border-[#8e7164]" style={{ borderRadius: 0 }}>
            <button className={`retro-btn font-[Geist,monospace] text-[12px] font-semibold px-2 py-1 flex items-center gap-1${tool === 'select' ? ' retro-btn-primary' : ''}`} onClick={() => setTool('select')}>
              <span className="material-symbols-outlined text-sm">cursor</span> 선택
            </button>
            <button className={`retro-btn font-[Geist,monospace] text-[12px] font-semibold px-2 py-1 flex items-center gap-1${tool === 'move' ? ' retro-btn-primary' : ''}`} onClick={() => setTool('move')}>
              <span className="material-symbols-outlined text-sm">open_with</span> 이동
            </button>
            <button className="retro-btn font-[Geist,monospace] text-[12px] font-semibold px-2 py-1 flex items-center gap-1" onClick={deleteSelected}>
              <span className="material-symbols-outlined text-sm">delete</span> 삭제
            </button>
            <div className="w-px h-4 bg-[#e3bfb1] mx-1" />
            <button className="retro-btn font-[Geist,monospace] text-[12px] font-semibold px-2 py-1 flex items-center gap-1" onClick={flipSelected}>
              <span className="material-symbols-outlined text-sm">flip</span> 반전
            </button>
            <button className="retro-btn font-[Geist,monospace] text-[12px] font-semibold px-2 py-1 flex items-center gap-1" onClick={bringForward}>
              <span className="material-symbols-outlined text-sm">flip_to_front</span> 앞으로
            </button>
            <button className="retro-btn font-[Geist,monospace] text-[12px] font-semibold px-2 py-1 flex items-center gap-1" onClick={sendBackward}>
              <span className="material-symbols-outlined text-sm">flip_to_back</span> 뒤로
            </button>
            <div className="ml-auto flex gap-2">
              <button className="retro-btn font-[Geist,monospace] text-[12px] font-semibold px-2 py-1">취소</button>
              <button className="retro-btn retro-btn-primary font-[Geist,monospace] text-[12px] font-semibold px-4 py-1 flex items-center gap-1" onClick={saveRoom}>
                <span className="material-symbols-outlined text-sm">save</span> 저장
              </button>
            </div>
          </div>

          {/* 본문 */}
          <div className="flex flex-col md:flex-row" style={{ minHeight: 520 }}>

            {/* 인벤토리 */}
            <div className="w-full md:w-52 flex-shrink-0 flex flex-col window-frame border-r border-[#8e7164]" style={{ borderRadius: 0, borderTop: 'none' }}>
              <div className="flex gap-1 p-1 border-b border-[#e3bfb1] flex-wrap">
                {Object.keys(INVENTORY).map(tab => (
                  <button key={tab} className={`inv-tab${invTab === tab ? ' active' : ''}`} onClick={() => setInvTab(tab)}>{tab}</button>
                ))}
              </div>
              <div className="p-1 grid grid-cols-3 gap-1 overflow-y-auto flex-1">
                {INVENTORY[invTab]?.map(inv => (
                  <div
                    key={inv.name}
                    className="inv-item"
                    draggable
                    onDragStart={() => setDraggingInv(inv)}
                    onDragEnd={() => setDraggingInv(null)}
                    onClick={() => placeItem(inv, 40 + Math.random() * 20, 30 + Math.random() * 20)}
                  >
                    <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1", color: inv.color }}>{inv.icon}</span>
                    <span style={{ fontSize: 9, fontFamily: 'Geist, monospace', textAlign: 'center' }}>{inv.name}</span>
                  </div>
                ))}
              </div>

              {/* 배경 선택 */}
              <div className="border-t border-[#e3bfb1] p-1">
                <div className="font-[Geist,monospace] text-[12px] text-[#5a4136] mb-1">배경 선택</div>
                <div className="flex gap-1 flex-wrap">
                  {BG_OPTIONS.map((opt, i) => (
                    <div
                      key={i}
                      className={`bg-option${selectedBg === i ? ' selected-bg' : ''}`}
                      style={{ background: opt.gradient }}
                      title={opt.title}
                      onClick={() => { setBg(opt.gradient); setSelectedBg(i) }}
                    />
                  ))}
                </div>
              </div>

              {selectedItem && (
                <div className="border-t border-[#e3bfb1] p-1 window-inset">
                  <div className="font-[Geist,monospace] text-[12px] text-[#5a4136] mb-1">선택된 아이템</div>
                  <div className="font-[Geist,monospace] text-[12px] font-bold text-[#1a1c1c]">{selectedItem.name}</div>
                  <div className="flex gap-1 mt-1">
                    <button className="retro-btn font-[Geist,monospace] text-[10px] font-semibold px-1 py-1" onClick={flipSelected}>반전</button>
                    <button className="retro-btn font-[Geist,monospace] text-[10px] font-semibold px-1 py-1" onClick={deleteSelected}>삭제</button>
                  </div>
                </div>
              )}
            </div>

            {/* 캔버스 */}
            <div className="flex-1 flex flex-col">
              <div
                ref={canvasRef}
                className="flex-1 relative"
                style={{
                  minHeight: 480,
                  background: bg,
                  backgroundImage: 'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
                  backgroundSize: '40px 40px',
                  cursor: 'crosshair',
                  overflow: 'hidden',
                }}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => setSelectedId(null)}
              >
                <div style={{ position: 'absolute', bottom: '35%', left: 0, right: 0, height: 2, background: 'rgba(0,0,0,0.1)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '35%', background: 'linear-gradient(to bottom, transparent, rgba(180,140,90,0.25))', pointerEvents: 'none' }} />

                {items.map(item => (
                  item.visible && (
                    <div
                      key={item.id}
                      className={`placed-item${item.id === selectedId ? ' selected-item' : ''}`}
                      style={{ left: `${item.x}%`, top: `${item.y}%`, zIndex: item.zIndex }}
                      onMouseDown={(e) => handleItemMouseDown(e, item.id)}
                      onClick={(e) => { e.stopPropagation(); setSelectedId(item.id) }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontVariationSettings: "'FILL' 1", color: item.color, fontSize: item.size, transform: item.flipped ? 'scaleX(-1)' : undefined }}
                      >{item.icon}</span>
                      <span className="item-label">{item.name}</span>
                    </div>
                  )
                ))}

                {isDragOver && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ background: 'rgba(255,102,0,0.05)', border: '2px dashed #ff6600' }}>
                    <div className="font-[Geist,monospace] text-[12px] font-semibold text-[#a33e00] bg-white px-2 py-1 window-inset">
                      여기에 아이템을 놓으세요
                    </div>
                  </div>
                )}
              </div>

              <div className="window-inset px-2 py-1 flex items-center justify-between" style={{ borderRadius: 0 }}>
                <div className="font-[Geist,monospace] text-[12px] text-[#5a4136] flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">{tool === 'select' ? 'cursor' : 'open_with'}</span>
                  {tool === 'select' ? '선택 모드' : '이동 모드'}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-[Geist,monospace] text-[12px] text-[#5a4136]">배치: <span className="text-[#a33e00] font-bold">{items.filter(i => i.visible).length}</span>개</span>
                  <button className="retro-btn font-[Geist,monospace] text-[10px] font-semibold px-1 py-1"
                    onClick={() => { if (confirm('모든 아이템을 제거하시겠습니까?')) { setItems([]); setSelectedId(null) } }}>
                    전체 제거
                  </button>
                </div>
              </div>
            </div>

            {/* 레이어 패널 */}
            <div className="w-full md:w-44 flex-shrink-0 flex flex-col window-frame border-l border-[#8e7164]" style={{ borderRadius: 0, borderTop: 'none' }}>
              <div className="p-1 border-b border-[#e3bfb1]">
                <div className="font-[Geist,monospace] text-[12px] font-bold text-[#1a1c1c]">레이어 목록</div>
              </div>
              <div className="flex-1 overflow-y-auto p-1 flex flex-col gap-1">
                {[...items].reverse().map(item => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-1 py-1 border-b border-[#e3bfb1] cursor-pointer${item.id === selectedId ? ' bg-[#baeaff]' : ''}`}
                    onClick={() => setSelectedId(item.id)}
                  >
                    <span className="material-symbols-outlined text-sm text-[#5a4136] cursor-pointer" onClick={(e) => { e.stopPropagation(); toggleVisibility(item.id) }}>
                      {item.visible ? 'visibility' : 'visibility_off'}
                    </span>
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1", color: item.color }}>{item.icon}</span>
                    <span className="font-[Geist,monospace] text-[12px] flex-1 truncate">{item.name}</span>
                    <span className="material-symbols-outlined text-[12px] text-[#5a4136]">drag_indicator</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-[#e3bfb1] p-1">
                <div className="font-[Geist,monospace] text-[12px] text-[#5a4136] mb-1">크기 조절</div>
                <input type="range" min={20} max={100} value={size} onChange={(e) => resizeSelected(Number(e.target.value))} className="w-full" style={{ accentColor: '#ff6600' }} />
                <div className="flex justify-between font-[Geist,monospace] text-[12px] text-[#5a4136] mt-1">
                  <span>작게</span><span>크게</span>
                </div>
              </div>

              <div className="border-t border-[#e3bfb1] p-1 flex flex-col gap-1">
                <button className="retro-btn retro-btn-primary w-full font-[Geist,monospace] text-[12px] font-semibold py-2 flex items-center justify-center gap-1" onClick={saveRoom}>
                  <span className="material-symbols-outlined text-sm">save</span> 저장하기
                </button>
                <button className="retro-btn w-full font-[Geist,monospace] text-[12px] font-semibold py-2 flex items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-sm">preview</span> 미리보기
                </button>
              </div>

              <div className="border-t border-[#e3bfb1] p-1 text-center font-[Geist,monospace] text-[10px] text-[#5a4136]">
                담당: 정용혁 · ROOM 도메인
              </div>
            </div>
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

      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] window-frame px-4 py-2 font-[Geist,monospace] text-[12px] font-semibold text-[#1a1c1c] flex items-center gap-1">
          <span className="material-symbols-outlined text-base text-[#0c6780]">check_circle</span>
          미니룸이 저장되었습니다!
        </div>
      )}
    </div>
  )
}
