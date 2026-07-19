import { useState, useEffect, useRef } from 'react'
import { minihompyApi } from '../api/minihompy'
import type { BgmOptionResponse, MinihompyMainResponse } from '../types'

interface Props {
  main: MinihompyMainResponse | null
  onBgmChanged: (bgmUrl: string | null) => void
  onTrackNameChange?: (name: string | null) => void
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

export default function BgmPlayer({ main, onBgmChanged, onTrackNameChange }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showBgmList, setShowBgmList] = useState(false)
  const [bgmOptions, setBgmOptions] = useState<BgmOptionResponse[]>([])
  const [bgmLoading, setBgmLoading] = useState(false)
  const [volume, setVolume] = useState(0.7)   // 0~1 사이 값, 기본 70%

  // bgmUrl이 있으면 진입 시 바로 목록을 불러와서 곡 이름을 알 수 있게 함
  useEffect(() => {
    if (!main?.bgmUrl) {
      onTrackNameChange?.(null)
      return
    }
    minihompyApi.getBgmOptions().then(res => {
      setBgmOptions(res.data.data)
      const applied = res.data.data.find(o => o.applied)
      onTrackNameChange?.(applied?.name ?? null)
    })
  }, [main?.bgmUrl])

  useEffect(() => {
    if (!audioRef.current || !main?.bgmUrl) return
    audioRef.current.load()
    audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
  }, [main?.bgmUrl])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {})
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

  const selectBgm = async (itemId: number) => {
    try {
      const res = await minihompyApi.applyBgm(itemId)
      const selected = bgmOptions.find(o => o.itemId === itemId)
      setBgmOptions(prev => prev.map(o => ({ ...o, applied: o.itemId === itemId })))
      onBgmChanged(res.data.data.mediaUrl)
      onTrackNameChange?.(selected?.name ?? null)   // 추가

      if (audioRef.current && res.data.data.mediaUrl) {
        audioRef.current.src = res.data.data.mediaUrl
        audioRef.current.load()
        await audioRef.current.play()
        setIsPlaying(true)
      }

      setShowBgmList(false)
    } catch (e) {
      console.error('BGM 적용 실패', e)
      setIsPlaying(false)
    }
    
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(Number(e.target.value))
  }

  const currentTrackName = bgmOptions.find(o => o.applied)?.name

  return (
    <div className="flex items-center gap-2 bg-[#f9f9f9] window-inset px-2 py-1 relative">
      {main?.bgmUrl && <audio ref={audioRef} src={main.bgmUrl} loop />}

      <span className="material-symbols-outlined text-sm text-[#a33e00]">music_note</span>
      <div className="w-36 overflow-hidden">
        <div className="w-40 overflow-hidden">
          <MarqueeText text={main?.bgmUrl ? (currentTrackName ?? 'BGM 재생 중') : 'BGM이 설정되지 않았습니다'} />
        </div>
      </div>
      <div className="flex gap-1">
        <button className="retro-btn p-1" onClick={togglePlay} disabled={!main?.bgmUrl}>
          <span className="material-symbols-outlined text-[12px]">{isPlaying ? 'pause' : 'play_arrow'}</span>
        </button>
        <button className="retro-btn p-1" onClick={openBgmList}>
          <span className="material-symbols-outlined text-[12px]">queue_music</span>
        </button>
        {/* 볼륨 슬라이더 */}
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

      {showBgmList && (
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