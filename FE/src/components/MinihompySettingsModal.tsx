import { useState, useEffect, useRef } from 'react'
import { minihompyApi } from '../api/minihompy' 
import type { AccessLevel, BackgroundDotOptionResponse, MinihompyMainResponse } from '../types'
import { MOOD_EMOJIS, parseMood } from '../utils/mood'

interface Props {
  main: MinihompyMainResponse | null
  onClose: () => void
  onSaved: (updated: MinihompyMainResponse) => void
}

export default function MinihompySettingsModal({ main, onClose, onSaved }: Props) {
  const initialMood = parseMood(main?.mood)

  const [introduction, setIntroduction] = useState(main?.introduction ?? '')
  const [moodEmoji, setMoodEmoji] = useState(initialMood.emoji)
  const [moodText, setMoodText] = useState(initialMood.text)
  const [accessLevel, setAccessLevel] = useState<AccessLevel>(main?.accessLevel ?? 'ALL')

  const [bgMode, setBgMode] = useState<'color' | 'image'>(main?.backgroundImageUrl ? 'image' : 'color')
  const [dotOptions, setDotOptions] = useState<BackgroundDotOptionResponse[]>([])
  const [selectedDotCode, setSelectedDotCode] = useState<string | null>(null)
  const [bgImageFile, setBgImageFile] = useState<File | null>(null)
  const [bgImagePreview, setBgImagePreview] = useState<string | null>(main?.backgroundImageUrl ?? null)
  const bgFileInputRef = useRef<HTMLInputElement>(null)

  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    minihompyApi.getBackgroundDotOptions()
      .then(res => {
        setDotOptions(res.data.data)
        const matched = res.data.data.find(opt => opt.hex === main?.backgroundColor)
        setSelectedDotCode(matched?.code ?? null)
      })
      .catch(err => {
        console.error('배경 색상 옵션 조회 실패', err)
      })
  }, [main])

  const handleBgImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (bgImagePreview && bgImageFile) URL.revokeObjectURL(bgImagePreview)
    setBgImageFile(file)
    setBgImagePreview(URL.createObjectURL(file))
    setBgMode('image')
  }

  const handleClose = () => {
    if (isSaving) return
    if (bgImagePreview && bgImageFile) URL.revokeObjectURL(bgImagePreview)
    onClose()
  }

  const handleSubmit = async () => {
    if (isSaving) return
    setIsSaving(true)
    setError('')
    try {
      if (bgMode === 'image' && bgImageFile) {
        await minihompyApi.uploadPhotoBackground(bgImageFile)
      } else if (bgMode === 'color' && selectedDotCode) {
        await minihompyApi.applyDotBackground(selectedDotCode)
      }

      const res = await minihompyApi.updateSettings({
        accessLevel,
        introduction: introduction.trim(),
        mood: `${moodEmoji} ${moodText.trim()}`.trim(),
      })
      onSaved(res.data.data)
    } catch (e: any) {
      setError(e.response?.data?.message ?? '설정 저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-2">
      <div className="window-frame bg-[#f9f9f9] w-full max-w-lg flex flex-col" style={{ maxHeight: '90vh' }}>
        <div className="bg-[#e2e2e2] px-3 py-2 border-b-2 border-[#8e7164] flex items-center gap-2 flex-shrink-0">
          <span className="material-symbols-outlined text-sm text-[#a33e00]">settings</span>
          <span className="font-[Geist,monospace] text-[13px] font-bold text-[#1a1c1c]">미니홈피 설정</span>
          <button className="ml-auto retro-btn p-1" onClick={handleClose} disabled={isSaving}>
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-3 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="font-[Geist,monospace] text-[12px] font-semibold text-[#5a4136]">배경화면</label>
            <div className="flex gap-1">
              <button className={`retro-btn font-[Geist,monospace] text-[12px] font-semibold px-3 py-1 flex-1${bgMode === 'color' ? ' retro-btn-primary' : ''}`} onClick={() => setBgMode('color')}>색상</button>
              <button className={`retro-btn font-[Geist,monospace] text-[12px] font-semibold px-3 py-1 flex-1${bgMode === 'image' ? ' retro-btn-primary' : ''}`} onClick={() => setBgMode('image')}>사진</button>
            </div>

            {bgMode === 'color' ? (
              <div className="grid grid-cols-6 gap-2">
                {dotOptions.map(opt => (
                  <button
                    key={opt.code}
                    onClick={() => setSelectedDotCode(opt.code)}
                    className={`w-8 h-8 border-2 ${selectedDotCode === opt.code ? 'border-[#a33e00]' : 'border-[#8e7164]'}`}
                    style={{ background: opt.hex }}
                    title={opt.code}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <input ref={bgFileInputRef} type="file" accept="image/*" className="hidden" onChange={handleBgImageSelect} />
                <button className="retro-btn font-[Geist,monospace] text-[12px] font-semibold px-3 py-2 flex items-center gap-1 self-start" onClick={() => bgFileInputRef.current?.click()}>
                  <span className="material-symbols-outlined text-sm">image</span> 사진 선택
                </button>
                {bgImagePreview && <img src={bgImagePreview} alt="" className="w-full h-32 object-cover border border-[#8e7164]" />}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-[Geist,monospace] text-[12px] font-semibold text-[#5a4136]">소개글</label>
            <textarea
              className="window-inset p-2 text-[14px] focus:outline-none w-full resize-none"
              rows={2}
              maxLength={200}
              placeholder="자신을 소개해보세요"
              value={introduction}
              onChange={(e) => setIntroduction(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-[Geist,monospace] text-[12px] font-semibold text-[#5a4136]">오늘의 기분</label>
            <div className="flex gap-1 flex-wrap">
              {MOOD_EMOJIS.map(e => (
                <button key={e} className={`retro-btn px-2 py-1 text-lg${moodEmoji === e ? ' retro-btn-primary' : ''}`} onClick={() => setMoodEmoji(e)}>{e}</button>
              ))}
            </div>
            <input
              className="window-inset p-2 text-[14px] focus:outline-none w-full mt-1"
              type="text"
              placeholder="기분을 텍스트로 표현해보세요 (예: 맑음)"
              maxLength={20}
              value={moodText}
              onChange={(e) => setMoodText(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-[Geist,monospace] text-[12px] font-semibold text-[#5a4136]">미니홈피 공개범위</label>
            <div className="flex gap-1">
              {(['ALL', 'FRIEND', 'PRIVATE'] as const).map(v => (
                <button
                  key={v}
                  className={`retro-btn font-[Geist,monospace] text-[12px] font-semibold px-3 py-1 flex-1${accessLevel === v ? ' retro-btn-primary' : ''}`}
                  onClick={() => setAccessLevel(v)}
                >
                  {{ ALL: '전체공개', FRIEND: '일촌공개', PRIVATE: '비공개' }[v]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && <p className="px-3 py-1 font-[Geist,monospace] text-[12px] text-[#ba1a1a] border-t border-[#8e7164]">{error}</p>}

        <div className="px-3 py-2 border-t border-[#8e7164] flex gap-2 flex-shrink-0">
          <button className="retro-btn font-[Geist,monospace] text-[12px] font-semibold px-4 py-2 flex-1" onClick={handleClose} disabled={isSaving}>취소</button>
          <button className="retro-btn retro-btn-primary font-[Geist,monospace] text-[12px] font-semibold px-4 py-2 flex-1 flex items-center justify-center gap-1" onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  )
}