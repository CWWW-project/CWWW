import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { itemApi } from '../../api/item'
import { roomApi } from '../../api/room'
import type { InventoryItemResponse, RoomItemResponse, SaveRoomRequest } from '../../types'

const ASSET_ROOT = '/miniroom-assets'

type Placement = 'floor' | 'wall'
type PaletteTab = 'basic' | 'owned' | 'avatar' | 'background'

interface BackgroundDef {
  id: string
  name: string
  src: string
  width: number
  height: number
  inventoryId?: number
  assetKey?: string | null
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
  { id: 'classic', name: '클래식', src: `${ASSET_ROOT}/backgrounds/bg_room.png`, width: 750, height: 606 },
  { id: 'grass', name: '잔디', src: `${ASSET_ROOT}/backgrounds/bg_grass.png`, width: 750, height: 612 },
  { id: 'space', name: '우주', src: `${ASSET_ROOT}/backgrounds/bg_universe.png`, width: 750, height: 606 },
]

const basicAvatarCatalog: CatalogItem[] = [
  { key: 'avatar-mint', name: '민트 기본 아바타', src: `${ASSET_ROOT}/avatars/avatar_02_mint.png`, width: 48, height: 72, placement: 'floor', category: 'AVATAR', sample: true },
  { key: 'avatar-rose', name: '로즈 기본 아바타', src: `${ASSET_ROOT}/avatars/avatar_01_rose.png`, width: 48, height: 72, placement: 'floor', category: 'AVATAR', sample: true },
  { key: 'avatar-sky', name: '스카이 기본 아바타', src: `${ASSET_ROOT}/avatars/avatar_03_sky.png`, width: 48, height: 72, placement: 'floor', category: 'AVATAR', sample: true },
]

const basicCatalog: CatalogItem[] = [
  ...basicAvatarCatalog,
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

const defaultAvatar: PlacedItem = {
  id: 'default-avatar',
  catalogKey: 'avatar-rose',
  x: 318,
  y: 438,
  scale: 1,
  rotation: 0,
  flipped: false,
  sortOrder: 40,
  locked: false,
  sample: true,
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

const nextId = () => `local-${Date.now()}-${Math.round(Math.random() * 100000)}`

const isBackgroundCategory = (category?: string) => category === 'BACKGROUND' || category === 'MINIROOM_BACKGROUND'

const isAvatarCategory = (category?: string) => category === 'AVATAR'

// 배경의 원근선에 맞춰 가운데는 높게, 양 끝은 낮게 바닥 시작점을 계산한다.
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

  // 이전 상품 데이터에 assetUrl이 없을 때도 꾸미기 화면이 깨지지 않도록 대표 이미지를 연결한다.
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

const backgroundForCatalogItem = (item: CatalogItem): BackgroundDef => ({
  id: item.key,
  name: item.name,
  src: item.src,
  width: item.width,
  height: item.height,
  inventoryId: item.inventoryId,
  assetKey: item.key,
})

const normalizePosition = (item: RoomItemResponse) => {
  return { x: item.posX, y: item.posY }
}

export default function MiniroomPage() {
  const navigate = useNavigate()
  const canvasRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null)
  const [backgroundId, setBackgroundId] = useState('classic')
  const [ownedCatalog, setOwnedCatalog] = useState<CatalogItem[]>([])
  const [items, setItems] = useState<PlacedItem[]>([defaultAvatar])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<PaletteTab>('basic')
  const [savedAt, setSavedAt] = useState('아직 저장 전')
  const [notice, setNotice] = useState<string | null>(null)

  const ownedBackgrounds = useMemo(
    () => ownedCatalog.filter(item => isBackgroundCategory(item.category)).map(backgroundForCatalogItem),
    [ownedCatalog],
  )
  const backgroundCatalog = useMemo(() => [...backgrounds, ...ownedBackgrounds], [ownedBackgrounds])
  const background = backgroundCatalog.find(bg => bg.id === backgroundId) ?? backgroundCatalog[0]
  const catalog = useMemo(() => {
    const map = new Map<string, CatalogItem>()
    basicCatalog.forEach(item => map.set(item.key, item))
    ownedCatalog.forEach(item => map.set(item.key, item))
    return [...map.values()]
  }, [ownedCatalog])
  const itemMap = useMemo(() => new Map(catalog.map(item => [item.key, item])), [catalog])
  const selected = items.find(item => item.id === selectedId) ?? null
  const selectedDef = selected ? itemMap.get(selected.catalogKey) : null

  const ownedItems = ownedCatalog.filter(item => !isBackgroundCategory(item.category) && !isAvatarCategory(item.category))
  const ownedAvatarItems = ownedCatalog.filter(item => isAvatarCategory(item.category))
  const basicItems = basicCatalog.filter(item => !isAvatarCategory(item.category))

  // 벽 장식과 바닥 가구가 각자 배치 가능한 영역을 벗어나지 않도록 좌표를 제한한다.
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
        const nextBackgrounds = nextOwned.filter(item => isBackgroundCategory(item.category)).map(backgroundForCatalogItem)

        try {
          const roomResponse = await roomApi.getMyRoom()
          const ownedByInventory = new Map(nextOwned.map(item => [item.inventoryId, item]))
          const snapshotDefs: CatalogItem[] = []
          const serverItems = roomResponse.data.data.items.map(roomItem => {
            // 보유함에서 찾지 못한 기본 장식은 서버가 내려준 스냅샷으로 카탈로그를 복원한다.
            const def = roomItem.userInventoryId
              ? ownedByInventory.get(roomItem.userInventoryId)
              : null
            const catalogDef = def ?? {
              key: roomItem.assetKey ? `snapshot-${roomItem.roomItemId}-${roomItem.assetKey}` : `snapshot-${roomItem.roomItemId}`,
              name: roomItem.name,
              src: roomItem.assetUrl ?? '',
              width: roomItem.assetWidth ?? 80,
              height: roomItem.assetHeight ?? 80,
              placement: roomItem.placementType === 'WALL' ? 'wall' as const : 'floor' as const,
              category: roomItem.category,
              sample: true,
            }
            if (!def) snapshotDefs.push(catalogDef)
            const position = normalizePosition(roomItem)
            return {
              id: `room-${roomItem.roomItemId}`,
              catalogKey: catalogDef.key,
              userInventoryId: roomItem.userInventoryId ?? undefined,
              x: position.x,
              y: position.y,
              scale: Number(roomItem.scale ?? 1),
              rotation: roomItem.rotation ?? 0,
              flipped: roomItem.flipped ?? false,
              sortOrder: roomItem.sortOrder ?? 1,
              locked: roomItem.locked ?? false,
            }
          })

          const roomBackground = [...backgrounds, ...nextBackgrounds].find(bg =>
            bg.inventoryId === roomResponse.data.data.backgroundInventoryId
            || bg.src === roomResponse.data.data.backgroundAssetUrl
            || bg.id === roomResponse.data.data.backgroundAssetKey
            || bg.assetKey === roomResponse.data.data.backgroundAssetKey
          )
          if (roomBackground) setBackgroundId(roomBackground.id)

          const avatar = roomResponse.data.data.avatar
          const avatarDef = avatar?.avatarInventoryId
            ? ownedByInventory.get(avatar.avatarInventoryId)
            : avatar?.assetUrl
              ? {
                key: avatar.assetKey ?? 'snapshot-avatar',
                name: '저장된 기본 아바타',
                src: avatar.assetUrl,
                width: avatar.assetWidth ?? 48,
                height: avatar.assetHeight ?? 72,
                placement: 'floor' as const,
                category: 'AVATAR',
                sample: true,
              }
              : null
          if (avatarDef && !avatar?.avatarInventoryId) {
            snapshotDefs.push(avatarDef)
          }
          const serverAvatar = avatar && avatarDef ? {
            id: avatar.avatarId ? `avatar-${avatar.avatarId}` : 'avatar-snapshot',
            catalogKey: avatarDef.key,
            userInventoryId: avatar.avatarInventoryId ?? undefined,
            x: avatar?.posX ?? 318,
            y: avatar?.posY ?? 438,
            scale: Number(avatar?.scale ?? 1),
            rotation: 0,
            flipped: avatar?.flipped ?? false,
            sortOrder: 40,
            locked: false,
          } : null

          setOwnedCatalog([...nextOwned, ...snapshotDefs])
          setItems([...(serverAvatar ? [serverAvatar] : [defaultAvatar]), ...serverItems])
        } catch {
          setOwnedCatalog(nextOwned)
          setItems([defaultAvatar])
        }
      } catch {
        setOwnedCatalog([])
        setItems([defaultAvatar])
        setNotice('로그인 후 상점에서 구매한 아이템으로 미니룸을 꾸밀 수 있습니다.')
      }
    }

    void loadRoom()
  }, [])

  const focusItem = (id: string) => {
    setSelectedId(id)
    setItems(prev => {
      const maxOrder = prev.reduce((max, item) => Math.max(max, item.sortOrder), 0)
      return prev.map(item => item.id === id && !item.locked ? { ...item, sortOrder: maxOrder + 1 } : item)
    })
  }

  const updateSelected = (patch: Partial<PlacedItem>) => {
    if (!selectedId || selected?.locked) return
    setItems(prev => prev.map(item => item.id === selectedId ? { ...item, ...patch } : item))
  }

  const addItem = (def: CatalogItem) => {
    if (isAvatarCategory(def.category)) {
      // 아바타는 한 명만 배치할 수 있으므로 새 선택으로 기존 아바타를 교체한다.
      const avatarItem: PlacedItem = {
        id: nextId(),
        catalogKey: def.key,
        userInventoryId: def.inventoryId,
        x: 318,
        y: 438,
        scale: 1,
        rotation: 0,
        flipped: false,
        sortOrder: 40,
        locked: false,
        sample: !def.inventoryId,
      }
      setItems(prev => [...prev.filter(item => !isAvatarCategory(itemMap.get(item.catalogKey)?.category)), avatarItem])
      setSelectedId(avatarItem.id)
      return
    }

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
    if (!def || placed.locked) return
    const rect = canvasRef.current.getBoundingClientRect()
    // 반응형으로 줄어든 화면 좌표를 원본 배경 좌표계로 바꿔 저장 위치가 해상도에 따라 달라지지 않게 한다.
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
    setItems(prev => prev.filter(item => {
      const def = itemMap.get(item.catalogKey)
      return isAvatarCategory(def?.category)
    }))
    setSelectedId(null)
    setNotice('배치한 가구와 벽장식을 비웠습니다.')
  }

  const saveRoom = async () => {
    const persistentItems = items.filter(item => {
      const def = itemMap.get(item.catalogKey)
      return def && !isAvatarCategory(def.category)
    })
    const avatarItem = items.find(item => {
      const def = itemMap.get(item.catalogKey)
      return isAvatarCategory(def?.category)
    })
    const avatarDef = avatarItem ? itemMap.get(avatarItem.catalogKey) : null
    // 기본 에셋은 보유함 ID가 없으므로 서버가 다시 그릴 수 있도록 에셋 정보도 함께 보낸다.
    const request: SaveRoomRequest = {
      backgroundInventoryId: background.inventoryId ?? null,
      backgroundAssetKey: background.assetKey ?? background.id,
      backgroundAssetUrl: background.src,
      avatar: avatarItem && avatarDef ? {
        avatarInventoryId: avatarItem.userInventoryId ?? null,
        assetKey: avatarDef.key,
        assetUrl: avatarDef.src,
        assetWidth: avatarDef.width,
        assetHeight: avatarDef.height,
        posX: Math.round(avatarItem.x),
        posY: Math.round(avatarItem.y),
        scale: Number(avatarItem.scale.toFixed(2)),
        flipped: avatarItem.flipped,
      } : null,
      items: persistentItems.map(item => ({
        userInventoryId: item.userInventoryId ?? null,
        category: itemMap.get(item.catalogKey)?.category ?? null,
        name: itemMap.get(item.catalogKey)?.name ?? null,
        assetKey: itemMap.get(item.catalogKey)?.key ?? null,
        assetUrl: itemMap.get(item.catalogKey)?.src ?? null,
        assetWidth: itemMap.get(item.catalogKey)?.width ?? null,
        assetHeight: itemMap.get(item.catalogKey)?.height ?? null,
        placementType: itemMap.get(item.catalogKey)?.placement === 'wall' ? 'WALL' : 'FLOOR',
        posX: Math.round(item.x),
        posY: Math.round(item.y),
        rotation: item.rotation,
        flipped: item.flipped,
        scale: Number(item.scale.toFixed(2)),
        sortOrder: item.sortOrder,
        locked: item.locked,
      })),
    }

    try {
      await roomApi.saveMyRoom(request)
      setSavedAt(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }))
      setNotice('보유 아이템 배치를 저장했습니다. 쇼케이스 장식은 화면 연출용입니다.')
      navigate('/')
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
          <em>{item.inventoryId ? '보유' : '기본'}</em>
        </button>
      ))}
    </div>
  )

  return (
    <div className="cy-room-editor-shell">
      <section className="cy-room-editor-window cy-isometric-editor">
        <header className="cy-room-editor-header">
          <div>
            <p>미니룸 편집기</p>
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
            <button className={activeTab === 'basic' ? 'active' : ''} onClick={() => setActiveTab('basic')}>기본 아이템</button>
            <button className={activeTab === 'owned' ? 'active' : ''} onClick={() => setActiveTab('owned')}>보유 아이템</button>
            <button className={activeTab === 'avatar' ? 'active' : ''} onClick={() => setActiveTab('avatar')}>아바타</button>
            <button className={activeTab === 'background' ? 'active' : ''} onClick={() => setActiveTab('background')}>배경</button>
          </div>

          {activeTab === 'basic' && renderPalette([...basicAvatarCatalog, ...basicItems])}
          {activeTab === 'owned' && (
            ownedItems.length > 0 ? renderPalette(ownedItems) : (
              <div className="cy-empty-palette">보유 아이템이 없습니다. 상점에서 미니룸 아이템을 구매해주세요.</div>
            )
          )}
          {activeTab === 'avatar' && (
            ownedAvatarItems.length > 0 ? renderPalette(ownedAvatarItems) : (
              <div className="cy-empty-palette">보유 아바타가 없습니다. 상점에서 아바타를 구매해주세요.</div>
            )
          )}
          {activeTab === 'background' && (
            ownedBackgrounds.length > 0 ? (
              <div className="cy-background-grid cy-bottom-backgrounds">
                {ownedBackgrounds.map(bg => (
                  <button className={backgroundId === bg.id ? 'active' : ''} key={bg.id} onClick={() => setBackgroundId(bg.id)}>
                    <img src={bg.src} alt="" />
                    <span>{bg.name}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="cy-empty-palette">보유 배경이 없습니다. 상점에서 미니룸 배경을 구매해주세요.</div>
            )
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
