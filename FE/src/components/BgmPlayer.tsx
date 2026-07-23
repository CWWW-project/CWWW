import { useState, useEffect } from 'react'
import { minihompyApi } from '../api/minihompy'
import { getAudioElement } from '../store/audioPlayer'
import type { BgmOptionResponse, MinihompyMainResponse } from '../types'

interface Props {
  main: MinihompyMainResponse | null
  onBgmChanged: (bgmUrl: string | null) => void
  onTrackNameChange?: (name: string | null) => void
  readOnly?: boolean
}

function MarqueeText({ text }: { text: string }) {
  const shouldScroll = text.length > 14
  if (!shouldScroll) {
    return (
      <div className="w-40 overflow-hidden">
        <span className="font-[Geist,monospace] text-[12px] text-[#5a4136] whitespace-nowrap">
          {text}
        </span>
      </div>
    )
  }
  return (
    <div className="w-40 overflow-hidden relative">
      <div
        className="flex whitespace-nowrap font-[Geist,monospace] text-[12px] text-[#5a4136] w-max"
        style={{ animation: `marquee-seamless ${Math.max(text.length * 0.4, 6)}s linear infinite` }}
      >
        <span className="pr-10">{text}</span>
        <span className="pr-10">{text}</span>
      </div>
    </div>
  )
}

export default function BgmPlayer({ main, onBgmChanged, onTrackNameChange, readOnly }: Props) {
  const audio = getAudioElement()

  const [isPlaying, setIsPlaying] = useState(!audio.paused)
  const [showBgmList, setShowBgmList] = useState(false)
  const [bgmOptions, setBgmOptions] = useState<BgmOptionResponse[]>([])
  const [bgmLoading, setBgmLoading] = useState(false)
  const [volume, setVolumeState] = useState(() => audio.volume)

  // 곡 이름 조회만 (재생 트리거는 절대 안 함 — App.tsx가 유일한 트리거)
  useEffect(() => {
    if (readOnly) return
    if (!main?.bgmUrl) {
      onTrackNameChange?.(null)
      return
    }
    minihompyApi.getBgmOptions().then(res => {
      setBgmOptions(res.data.data)
      const applied = res.data.data.find(o => o.applied)
      onTrackNameChange?.(applied?.name ?? null)
    })
  }, [main?.bgmUrl, readOnly])

  // 실제 오디오의 재생 상태를 버튼 아이콘에 동기화
  useEffect(() => {
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    return () => {
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
    }
  }, [])

  const togglePlay = () => {
    if (audio.paused) {
      audio.play().catch(() => {})
    } else {
      audio.pause()
    }
  }

  const openBgmList = () => {
    setShowBgmList(prev => !prev)
    if (bgmOptions.length === 0) {
      setBgmLoading(true)
      minihompyApi.getBgmOptions()
        .then(res => setBgmOptions(res.data.data))
        .finally(() => setBgmLoading(false))
    }
  }

  // 곡 선택 → main.bgmUrl만 갱신. 실제 재생은 App.tsx의 useGlobalBgm이 감지해서 처리
  const selectBgm = async (itemId: number) => {
    try {
      const res = await minihompyApi.applyBgm(itemId)
      const selected = bgmOptions.find(o => o.itemId === itemId)
      setBgmOptions(prev => prev.map(o => ({ ...o, applied: o.itemId === itemId })))
      onBgmChanged(res.data.data.mediaUrl)
      onTrackNameChange?.(selected?.name ?? null)
      setShowBgmList(false)
    } catch (e) {
      console.error('BGM 적용 실패', e)
    }
  }

  const setVolume = (v: number) => {
    audio.volume = v
    setVolumeState(v)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(Number(e.target.value))
  }

  const currentTrackName = bgmOptions.find(o => o.applied)?.name

  return (
    <div className="flex items-center gap-2 bg-[#f9f9f9] window-inset px-2 py-1 relative">
      <span className="material-symbols-outlined text-sm text-[#a33e00]">music_note</span>
      <div className="w-36 overflow-hidden">
        <MarqueeText text={main?.bgmUrl ? (readOnly ? (main.bgmName ?? 'BGM 재생 중') : (currentTrackName ?? 'BGM 재생 중')) : 'BGM이 설정되지 않았습니다'} />
      </div>
      <div className="flex gap-1">
        <button className="retro-btn p-1" onClick={togglePlay} disabled={!main?.bgmUrl || !audio.src}>
          <span className="material-symbols-outlined text-[12px]">{isPlaying ? 'pause' : 'play_arrow'}</span>
        </button>
        {!readOnly && (
          <button className="retro-btn p-1" onClick={openBgmList}>
            <span className="material-symbols-outlined text-[12px]">queue_music</span>
          </button>
        )}
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={handleVolumeChange}
          className="w-14 accent-[#a33e00] cursor-pointer"
          title={`볼륨 ${Math.round(volume * 100)}%`}
        />
      </div>

      {!readOnly && showBgmList && (
        <div className="absolute top-full right-0 mt-1 w-64 window-frame bg-[#f9f9f9] z-50 max-h-64 overflow-y-auto">
          <div className="bg-[#e2e2e2] px-2 py-1 border-b border-[#8e7164] font-[Geist,monospace] text-[11px] font-bold text-[#1a1c1c]">
            보유 BGM
          </div>
          {bgmLoading ? (
            <p className="p-2 font-[Geist,monospace] text-[11px] text-[#5a4136]">불러오는 중...</p>
          ) : bgmOptions.length === 0 ? (
            <p className="p-2 font-[Geist,monospace] text-[11px] text-[#5a4136]">보유한 BGM이 없습니다.</p>
          ) : (
            bgmOptions.map(opt => (
              <button
                key={opt.itemId}
                className={`w-full text-left px-2 py-1.5 font-[Geist,monospace] text-[11px] hover:bg-[#eeeeee] border-b border-[#e3bfb1] last:border-b-0${opt.applied ? ' text-[#a33e00] font-bold' : ' text-[#1a1c1c]'}`}
                onClick={() => selectBgm(opt.itemId)}
              >
                {opt.applied && '▶ '}{opt.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}