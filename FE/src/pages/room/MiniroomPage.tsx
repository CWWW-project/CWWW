import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { itemApi } from '../../api/item'
import { roomApi } from '../../api/room'
import type { InventoryItemResponse, RoomItemResponse } from '../../types'

const ASSET_ROOT = '/miniroom-assets'
const ROOM_WIDTH = 750
const ROOM_HEIGHT = 606

type Placement = 'floor' | 'wall'
type PaletteTab = 'owned' | 'furniture' | 'wall' | 'background'

interface BackgroundDef {
  id: string
  name: string
  src: string
  width: number
  height: number
}

interface CatalogItem {
  key: string
  name: string
  src: string
  width: number
  height: number
  placement: Placement
  inventoryId?: number
  category?: string
  sample?: boolean
}

interface PlacedItem {
  id: string
  catalogKey: string
  userInventoryId?: number
  x: number
  y: number
  scale: number
  rotation: number
  flipped: boolean
  sortOrder: number
  locked: boolean
  sample?: boolean
}

const backgrounds: BackgroundDef[] = [
  { id: 'pink', name: '핑크룸', src: `${ASSET_ROOT}/rooms/room-pink.svg`, width: 750, height: 606 },
  { id: 'blue', name: '블루룸', src: `${ASSET_ROOT}/rooms/room-blue.svg`, width: 750, height: 606 },
  { id: 'green', name: '그린룸', src: `${ASSET_ROOT}/rooms/room-green.svg`, width: 750, height: 606 },
  { id: 'lab', name: '랩룸', src: `${ASSET_ROOT}/rooms/room-lab.svg`, width: 750, height: 606 },
  { id: 'classic', name: '클래식', src: `${ASSET_ROOT}/backgrounds/bg_room.png`, width: 750, height: 606 },
  { id: 'grass', name: '잔디', src: `${ASSET_ROOT}/backgrounds/bg_grass.png`, width: 750, height: 612 },
  { id: 'space', name: '우주', src: `${ASSET_ROOT}/backgrounds/bg_universe.png`, width: 750, height: 606 },
]

const showcaseCatalog: CatalogItem[] = [
  { key: 'avatar-basic', name: '미니미', src: `${ASSET_ROOT}/avatars-grafxkid/grafxkid_avatar_01.png`, width: 36, height: 56, placement: 'floor', category: 'AVATAR', sample: true },
  { key: 'sofa-blue', name: '블루 소파', src: `${ASSET_ROOT}/items/sofa_blue.png`, width: 126, height: 126, placement: 'floor', category: 'MINIROOM', sample: true },
  { key: 'wood-desk', name: '원목 책상', src: `${ASSET_ROOT}/kenney/isometric/desk_SE.png`, width: 85, height: 88, placement: 'floor', category: 'MINIROOM', sample: true },
  { key: 'desk-chair', name: '책상 의자', src: `${ASSET_ROOT}/kenney/isometric/chairDesk_SE.png`, width: 57, height: 72, placement: 'floor', category: 'MINIROOM', sample: true },
  { key: 'computer', name: '컴퓨터', src: `${ASSET_ROOT}/kenney/isometric/computerScreen_SE.png`, width: 43, height: 49, placement: 'floor', category: 'MINIROOM', sample: true },
  { key: 'keyboard', name: '키보드', src: `${ASSET_ROOT}/kenney/isometric/computerKeyboard_SE.png`, width: 40, height: 18, placement: 'floor', category: 'MINIROOM', sample: true },
  { key: 'bed-blue', name: '블루 침대', src: `${ASSET_ROOT}/items/bed_blue_dots.png`, width: 126, height: 126, placement: 'floor', category: 'MINIROOM', sample: true },
  { key: 'bear', name: '곰인형', src: `${ASSET_ROOT}/kenney/isometric/bear_SW.png`, width: 52, height: 71, placement: 'floor', category: 'MINIROOM', sample: true },
  { key: 'bookcase', name: '책장', src: `${ASSET_ROOT}/kenney/isometric/bookcaseOpen_SE.png`, width: 69, height: 113, placement: 'floor', category: 'MINIROOM', sample: true },
  { key: 'floor-lamp', name: '스탠드', src: `${ASSET_ROOT}/items/floor_lamp_orange.png`, width: 126, height: 126, placement: 'floor', category: 'MINIROOM', sample: true },
  { key: 'rug', name: '러그', src: `${ASSET_ROOT}/items/rug_striped.png`, width: 126, height: 126, placement: 'floor', category: 'MINIROOM', sample: true },
  { key: 'plant', name: '화분', src: `${ASSET_ROOT}/kenney/isometric/plantSmall2_SE.png`, width: 41, height: 52, placement: 'floor', category: 'MINIROOM', sample: true },
  { key: 'window', name: '창문', src: `${ASSET_ROOT}/kenney/isometric/wallWindow_SE.png`, width: 78, height: 90, placement: 'wall', category: 'MINIROOM', sample: true },
  { key: 'door', name: '문', src: `${ASSET_ROOT}/kenney/isometric/doorway_SE.png`, width: 60, height: 113, placement: 'wall', category: 'MINIROOM', sample: true },
  { key: 'wall-frame', name: '벽 액자', src: `${ASSET_ROOT}/items/wall_frame_leaf.png`, width: 126, height: 126, placement: 'wall', category: 'MINIROOM', sample: true },
  { key: 'wall-clock', name: '벽시계', src: `${ASSET_ROOT}/items/clock_wall_simple.png`, width: 96, height: 96, placement: 'wall', category: 'MINIROOM', sample: true },
]

const starterScene: PlacedItem[] = [
  { id: 'scene-window', catalogKey: 'window', x: 92, y: 96, scale: 1.1, rotation: 0, flipped: false, sortOrder: 5, locked: false, sample: true },
  { id: 'scene-frame', catalogKey: 'wall-frame', x: 376, y: 42, scale: 0.78, rotation: 0, flipped: false, sortOrder: 6, locked: false, sample: true },
  { id: 'scene-door', catalogKey: 'door', x: 650, y: 250, scale: 1.05, rotation: 0, flipped: false, sortOrder: 7, locked: false, sample: true },
  { id: 'scene-desk', catalogKey: 'wood-desk', x: 128, y: 338, scale: 1.25, rotation: 0, flipped: false, sortOrder: 20, locked: false, sample: true },
  { id: 'scene-computer', catalogKey: 'computer', x: 160, y: 303, scale: 1.12, rotation: 0, flipped: false, sortOrder: 21, locked: false, sample: true },
  { id: 'scene-keyboard', catalogKey: 'keyboard', x: 175, y: 350, scale: 1, rotation: 0, flipped: false, sortOrder: 22, locked: false, sample: true },
  { id: 'scene-chair', catalogKey: 'desk-chair', x: 232, y: 378, scale: 1.05, rotation: 0, flipped: false, sortOrder: 24, locked: false, sample: true },
  { id: 'scene-bookcase', catalogKey: 'bookcase', x: 354, y: 206, scale: 1.2, rotation: 0, flipped: false, sortOrder: 25, locked: false, sample: true },
  { id: 'scene-rug', catalogKey: 'rug', x: 286, y: 424, scale: 1.28, rotation: 0, flipped: false, sortOrder: 26, locked: false, sample: true },
  { id: 'scene-bed', catalogKey: 'bed-blue', x: 492, y: 336, scale: 1.28, rotation: 0, flipped: false, sortOrder: 30, locked: false, sample: true },
  { id: 'scene-bear', catalogKey: 'bear', x: 640, y: 348, scale: 1.22, rotation: 0, flipped: false, sortOrder: 36, locked: false, sample: true },
  { id: 'scene-lamp', catalogKey: 'floor-lamp', x: 475, y: 255, scale: 0.68, rotation: 0, flipped: false, sortOrder: 37, locked: false, sample: true },
  { id: 'scene-avatar', catalogKey: 'avatar-basic', x: 318, y: 438, scale: 1.34, rotation: 0, flipped: false, sortOrder: 40, locked: false, sample: true },
]

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

const nextId = () => `local-${Date.now()}-${Math.round(Math.random() * 100000)}`

const floorLineAt = (x: number, bg: BackgroundDef) => {
  const center = bg.width / 2
  const edgeY = bg.height * 0.73
  const centerY = bg.height * 0.515
  const t = Math.min(1, Math.abs(x - center) / center)
  return centerY + (edgeY - centerY) * t
}

const sortForRoom = (item: PlacedItem, def?: CatalogItem) => {
  if (def?.placement === 'wall') return item.sortOrder
  return Math.round(item.y * 10) + item.sortOrder
}

const visualForInventory = (item: InventoryItemResponse): CatalogItem => {
  if (item.assetUrl) {
    return {
      key: item.assetKey ? `owned-${item.inventoryId}-${item.assetKey}` : `owned-${item.inventoryId}`,
      name: item.name,
      src: item.assetUrl,
      width: item.assetWidth ?? 126,
      height: item.assetHeight ?? 126,
      placement: item.placementType === 'WALL' || item.placementType === 'BACKGROUND' ? 'wall' : 'floor',
      inventoryId: item.inventoryId,
      category: item.category,
    }
  }

  const name = item.name.toLowerCase()
  if (item.category === 'AVATAR' || name.includes('minime')) {
    return { key: `owned-${item.inventoryId}`, name: item.name, src: `${ASSET_ROOT}/avatars-grafxkid/grafxkid_avatar_01.png`, width: 36, height: 56, placement: 'floor', inventoryId: item.inventoryId, category: item.category }
  }
  if (name.includes('sofa')) {
    return { key: `owned-${item.inventoryId}`, name: item.name, src: `${ASSET_ROOT}/items/sofa_blue.png`, width: 126, height: 126, placement: 'floor', inventoryId: item.inventoryId, category: item.category }
  }
  if (name.includes('desk')) {
    return { key: `owned-${item.inventoryId}`, name: item.name, src: `${ASSET_ROOT}/kenney/isometric/desk_SE.png`, width: 85, height: 88, placement: 'floor', inventoryId: item.inventoryId, category: item.category }
  }
  if (name.includes('lamp')) {
    return { key: `owned-${item.inventoryId}`, name: item.name, src: `${ASSET_ROOT}/items/floor_lamp_orange.png`, width: 126, height: 126, placement: 'floor', inventoryId: item.inventoryId, category: item.category }
  }
  return { key: `owned-${item.inventoryId}`, name: item.name, src: `${ASSET_ROOT}/kenney/isometric/cardboardBoxClosed_SE.png`, width: 32, height: 39, placement: 'floor', inventoryId: item.inventoryId, category: item.category }
}

const normalizePosition = (item: RoomItemResponse) => {
  if (item.posX <= 100 && item.posY <= 100) {
    return {
      x: Math.round((item.posX / 100) * ROOM_WIDTH),
      y: Math.round((item.posY / 100) * ROOM_HEIGHT),
    }
  }
  return { x: item.posX, y: item.posY }
}

export default function MiniroomPage() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null)
  const [backgroundId, setBackgroundId] = useState('pink')
  const [ownedCatalog, setOwnedCatalog] = useState<CatalogItem[]>([])
  const [items, setItems] = useState<PlacedItem[]>(starterScene)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<PaletteTab>('furniture')
  const [savedAt, setSavedAt] = useState('아직 저장 전')
  const [notice, setNotice] = useState<string | null>(null)

  const background = backgrounds.find(bg => bg.id === backgroundId) ?? backgrounds[0]
  const catalog = useMemo(() => {
    const map = new Map<string, CatalogItem>()
    showcaseCatalog.forEach(item => map.set(item.key, item))
    ownedCatalog.forEach(item => map.set(item.key, item))
    return [...map.values()]
  }, [ownedCatalog])
  const itemMap = useMemo(() => new Map(catalog.map(item => [item.key, item])), [catalog])
  const selected = items.find(item => item.id === selectedId) ?? null
  const selectedDef = selected ? itemMap.get(selected.catalogKey) : null

  const ownedItems = ownedCatalog.filter(item => item.category !== 'BACKGROUND')
  const furnitureItems = showcaseCatalog.filter(item => item.placement === 'floor' && item.category !== 'AVATAR')
  const wallItems = showcaseCatalog.filter(item => item.placement === 'wall')

  const constrainPosition = useCallback((rawX: number, rawY: number, placed: PlacedItem, def: CatalogItem) => {
    const scaledW = def.width * placed.scale
    const scaledH = def.height * placed.scale
    const x = clamp(rawX, 8, background.width - scaledW - 8)
    const centerX = x + scaledW / 2
    const line = floorLineAt(centerX, background)

    if (def.placement === 'wall') {
      return {
        x,
        y: clamp(rawY, 18, Math.max(26, line - scaledH - 20)),
      }
    }

    return {
      x,
      y: clamp(rawY, line - scaledH + 8, background.height - scaledH - 8),
    }
  }, [background])

  useEffect(() => {
    const loadRoom = async () => {
      try {
        const inventoryResponse = await itemApi.getInventory()
        const nextOwned = inventoryResponse.data.data.map(visualForInventory)
        setOwnedCatalog(nextOwned)

        try {
          const roomResponse = await roomApi.getMyRoom()
          const ownedByInventory = new Map(nextOwned.map(item => [item.inventoryId, item]))
          const serverItems = roomResponse.data.data.items.map(roomItem => {
            const def = ownedByInventory.get(roomItem.userInventoryId) ?? visualForInventory({
              inventoryId: roomItem.userInventoryId,
              itemId: roomItem.itemId,
              category: roomItem.category,
              name: roomItem.name,
              description: roomItem.description,
              price: 0,
              assetKey: roomItem.assetKey,
              assetUrl: roomItem.assetUrl,
              assetWidth: roomItem.assetWidth,
              assetHeight: roomItem.assetHeight,
              placementType: roomItem.placementType,
              acquiredAt: '',
            })
            const position = normalizePosition(roomItem)
            return {
              id: `room-${roomItem.roomItemId}`,
              catalogKey: def.key,
              userInventoryId: roomItem.userInventoryId,
              x: position.x,
              y: position.y,
              scale: Number(roomItem.scale ?? 1),
              rotation: roomItem.rotation ?? 0,
              flipped: roomItem.flipped ?? false,
              sortOrder: roomItem.sortOrder ?? 1,
              locked: roomItem.locked ?? false,
            }
          })

          const roomBackground = backgrounds.find(bg => bg.src === roomResponse.data.data.backgroundAssetUrl || bg.id === roomResponse.data.data.backgroundAssetKey)
          if (roomBackground) setBackgroundId(roomBackground.id)

          if (serverItems.length > 0) {
            setItems([...starterScene.filter(item => item.sample), ...serverItems])
          }
        } catch {
          setItems(starterScene)
        }
      } catch {
        setOwnedCatalog([])
        setItems(starterScene)
        setNotice('로그인 토큰이 없어서 쇼케이스 방으로 표시 중입니다.')
      }
    }

    void loadRoom()
  }, [])

  const focusItem = (id: string) => {
    setSelectedId(id)
    setItems(prev => {
      const maxOrder = prev.reduce((max, item) => Math.max(max, item.sortOrder), 0)
      return prev.map(item => item.id === id ? { ...item, sortOrder: maxOrder + 1 } : item)
    })
  }

  const updateSelected = (patch: Partial<PlacedItem>) => {
    if (!selectedId) return
    setItems(prev => prev.map(item => item.id === selectedId ? { ...item, ...patch } : item))
  }

  const addItem = (def: CatalogItem) => {
    const nextOrder = items.reduce((max, item) => Math.max(max, item.sortOrder), 0) + 1
    const draft: PlacedItem = {
      id: nextId(),
      catalogKey: def.key,
      userInventoryId: def.inventoryId,
      x: def.placement === 'wall' ? 350 : 320,
      y: def.placement === 'wall' ? 100 : 410,
      scale: def.width > 100 ? 0.95 : 1.15,
      rotation: 0,
      flipped: false,
      sortOrder: nextOrder,
      locked: false,
      sample: def.sample || !def.inventoryId,
    }
    const next = { ...draft, ...constrainPosition(draft.x + Math.random() * 70, draft.y + Math.random() * 35, draft, def) }
    setItems(prev => [...prev, next])
    setSelectedId(next.id)
  }

  const startDrag = (event: React.PointerEvent, placed: PlacedItem) => {
    if (!canvasRef.current) return
    const def = itemMap.get(placed.catalogKey)
    if (!def) return
    const rect = canvasRef.current.getBoundingClientRect()
    const scaleX = background.width / rect.width
    const scaleY = background.height / rect.height
    focusItem(placed.id)
    dragRef.current = {
      id: placed.id,
      offsetX: (event.clientX - rect.left) * scaleX - placed.x,
      offsetY: (event.clientY - rect.top) * scaleY - placed.y,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const moveDrag = (event: React.PointerEvent) => {
    if (!dragRef.current || !canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const scaleX = background.width / rect.width
    const scaleY = background.height / rect.height
    const placed = items.find(item => item.id === dragRef.current?.id)
    const def = placed ? itemMap.get(placed.catalogKey) : null
    if (!placed || !def) return
    const rawX = (event.clientX - rect.left) * scaleX - dragRef.current.offsetX
    const rawY = (event.clientY - rect.top) * scaleY - dragRef.current.offsetY
    const position = constrainPosition(rawX, rawY, placed, def)
    setItems(prev => prev.map(item => item.id === placed.id ? { ...item, ...position } : item))
  }

  const setSelectedScale = (scale: number) => {
    if (!selected || !selectedDef) return
    const next = { ...selected, scale: clamp(scale, 0.35, 2.4) }
    updateSelected({ scale: next.scale, ...constrainPosition(next.x, next.y, next, selectedDef) })
  }

  const deleteSelected = () => {
    if (!selected || selected.locked) return
    setItems(prev => prev.filter(item => item.id !== selected.id))
    setSelectedId(null)
  }

  const resetScene = () => {
    setItems(starterScene)
    setSelectedId(null)
    setNotice('기본 미니룸 배치로 되돌렸습니다.')
  }

  const saveRoom = async () => {
    const persistentItems = items.filter(item => item.userInventoryId && !item.sample)
    try {
      await roomApi.saveMyRoom({
        backgroundInventoryId: null,
        backgroundAssetKey: background.id,
        backgroundAssetUrl: background.src,
        items: persistentItems.map(item => ({
          userInventoryId: item.userInventoryId as number,
          posX: Math.round(item.x),
          posY: Math.round(item.y),
          rotation: item.rotation,
          flipped: item.flipped,
          scale: Number(item.scale.toFixed(2)),
          sortOrder: item.sortOrder,
          locked: item.locked,
        })),
      })
      setSavedAt(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }))
      setNotice('보유 아이템 배치를 저장했습니다. 쇼케이스 장식은 화면 연출용입니다.')
    } catch {
      setNotice('저장에 실패했습니다. 로그인 토큰과 백엔드 실행 상태를 확인해주세요.')
    }
  }

  const renderPalette = (list: CatalogItem[]) => (
    <div className="cy-bottom-palette-grid">
      {list.map(item => (
        <button key={item.key} onClick={() => addItem(item)} title={item.name}>
          <span className="cy-palette-thumb"><img src={item.src} alt="" /></span>
          <strong>{item.name}</strong>
          <em>{item.inventoryId ? '보유' : '연출'}</em>
        </button>
      ))}
    </div>
  )

  return (
    <div className="cy-room-editor-shell">
      <section className="cy-room-editor-window cy-isometric-editor">
        <header className="cy-room-editor-header">
          <div>
            <p>Mini Room Editor</p>
            <h1>내 미니룸 꾸미기</h1>
          </div>
          <div className="cy-room-editor-actions">
            <span>마지막 저장 {savedAt}</span>
            <button onClick={resetScene}>기본 배치</button>
            <button className="primary" onClick={saveRoom}>저장</button>
          </div>
        </header>

        <div className="cy-room-editor-layout cy-isometric-layout">
          <main className="cy-room-stage cy-isometric-stage">
            <div className="cy-stage-caption">
              <span>ROOM</span>
              <strong>가구를 드래그해서 배치하세요</strong>
            </div>
            <div
              ref={canvasRef}
              className="cy-room-canvas cy-isometric-canvas is-editing"
              onPointerMove={moveDrag}
              onPointerUp={() => { dragRef.current = null }}
              onPointerLeave={() => { dragRef.current = null }}
              onPointerDown={(event) => {
                if (event.target === event.currentTarget) setSelectedId(null)
              }}
              style={{ aspectRatio: `${background.width} / ${background.height}` }}
            >
              <img className="cy-room-bg" src={background.src} alt="" />
              <div className="cy-wall-decor-grid" />
              <div className="cy-floor-guide" />
              {[...items].sort((a, b) => sortForRoom(a, itemMap.get(a.catalogKey)) - sortForRoom(b, itemMap.get(b.catalogKey))).map(placed => {
                const def = itemMap.get(placed.catalogKey)
                if (!def) return null
                const active = selectedId === placed.id
                return (
                  <button
                    key={placed.id}
                    className={`cy-placed-item ${active ? 'selected' : ''} ${def.placement === 'wall' ? 'wall-item' : ''} ${placed.sample ? 'sample-item' : ''}`}
                    title={def.name}
                    onPointerDown={(event) => startDrag(event, placed)}
                    onClick={(event) => {
                      event.stopPropagation()
                      focusItem(placed.id)
                    }}
                    style={{
                      left: `${(placed.x / background.width) * 100}%`,
                      top: `${(placed.y / background.height) * 100}%`,
                      width: `${(def.width / background.width) * 100}%`,
                      zIndex: active ? 999 : sortForRoom(placed, def),
                      transform: `scale(${placed.scale}) rotate(${placed.rotation}deg)`,
                    }}
                  >
                    <img src={def.src} alt={def.name} style={{ transform: `scaleX(${placed.flipped ? -1 : 1})` }} />
                  </button>
                )
              })}
            </div>
          </main>

          <aside className="cy-quick-tools">
            {selected && selectedDef ? (
              <div className="cy-selection-toolbar">
                <div className="cy-selection-title">
                  <img src={selectedDef.src} alt="" />
                  <div>
                    <strong>{selectedDef.name}</strong>
                    <span>{selected.sample ? '쇼케이스 장식' : '저장 가능한 보유 아이템'}</span>
                  </div>
                </div>
                <div className="cy-slider-row">
                  <label>
                    크기 <b>{Math.round(selected.scale * 100)}%</b>
                    <input type="range" min="0.35" max="2.4" step="0.05" value={selected.scale} onChange={event => setSelectedScale(Number(event.target.value))} />
                  </label>
                  <label>
                    회전 <b>{selected.rotation}도</b>
                    <input type="range" min="-180" max="180" step="5" value={selected.rotation} onChange={event => updateSelected({ rotation: Number(event.target.value) })} />
                  </label>
                </div>
                <div className="cy-toolbar-actions">
                  <button onClick={() => updateSelected({ rotation: 0 })}>0도</button>
                  <button onClick={() => updateSelected({ flipped: !selected.flipped })}>좌우반전</button>
                  <button onClick={() => updateSelected({ sortOrder: selected.sortOrder + 1000 })}>앞으로</button>
                  <button onClick={() => updateSelected({ sortOrder: selected.sortOrder - 1000 })}>뒤로</button>
                  <button className="danger" disabled={selected.locked} onClick={deleteSelected}>삭제</button>
                </div>
              </div>
            ) : (
              <div className="cy-empty-selection">
                아이템을 선택하면 크기, 회전, 레이어를 조절할 수 있습니다.
              </div>
            )}
          </aside>
        </div>

        <section className="cy-bottom-palette">
          <div className="cy-editor-tabs">
            <button className={activeTab === 'owned' ? 'active' : ''} onClick={() => setActiveTab('owned')}>보유 아이템</button>
            <button className={activeTab === 'furniture' ? 'active' : ''} onClick={() => setActiveTab('furniture')}>가구 연출</button>
            <button className={activeTab === 'wall' ? 'active' : ''} onClick={() => setActiveTab('wall')}>벽 장식</button>
            <button className={activeTab === 'background' ? 'active' : ''} onClick={() => setActiveTab('background')}>배경</button>
          </div>

          {activeTab === 'owned' && (
            ownedItems.length > 0 ? renderPalette(ownedItems) : (
              <div className="cy-empty-palette">보유 아이템을 불러오지 못했습니다. 로그인 후 다시 확인해주세요.</div>
            )
          )}
          {activeTab === 'furniture' && renderPalette(furnitureItems)}
          {activeTab === 'wall' && renderPalette(wallItems)}
          {activeTab === 'background' && (
            <div className="cy-background-grid cy-bottom-backgrounds">
              {backgrounds.map(bg => (
                <button className={backgroundId === bg.id ? 'active' : ''} key={bg.id} onClick={() => setBackgroundId(bg.id)}>
                  <img src={bg.src} alt="" />
                  <span>{bg.name}</span>
                </button>
              ))}
            </div>
          )}
        </section>
      </section>

      {notice && (
        <div className="cy-mini-toast">
          {notice}
        </div>
      )}
    </div>
  )
}
