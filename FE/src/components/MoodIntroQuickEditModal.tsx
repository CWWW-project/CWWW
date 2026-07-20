import { useState } from 'react'
import { minihompyApi } from '../api/minihompy'
import type { MinihompyMainResponse } from '../types'
import { MOOD_EMOJIS, parseMoodEmoji } from '../utils/mood'

interface Props {
  main: MinihompyMainResponse | null
  onClose: () => void
  onSaved: (updated: MinihompyMainResponse) => void
}

export default function MoodIntroQuickEditModal({ main, onClose, onSaved }: Props) {
  const [moodEmoji, setMoodEmoji] = useState(parseMoodEmoji(main?.mood))
  const [introduction, setIntroduction] = useState(main?.introduction ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (isSaving || !main) return
    setIsSaving(true)
    setError('')
    try {
      const res = await minihompyApi.updateSettings({
        accessLevel: main.accessLevel,
        introduction: introduction.trim(),
        mood: moodEmoji,
      })
      onSaved(res.data.data)
    } catch (e: any) {
      setError(e.response?.data?.message ?? '저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-2">
      <div className="window-frame bg-[#f9f9f9] w-full max-w-sm flex flex-col">
        <div className="bg-[#e2e2e2] px-3 py-2 border-b-2 border-[#8e7164] flex items-center gap-2 flex-shrink-0">
          <span className="material-symbols-outlined text-sm text-[#a33e00]">mood</span>
          <span className="font-[Geist,monospace] text-[13px] font-bold text-[#1a1c1c]">기분 · 소개글</span>
          <button className="ml-auto retro-btn p-1" onClick={onClose} disabled={isSaving}>
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        <div className="p-3 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="font-[Geist,monospace] text-[12px] font-semibold text-[#5a4136]">오늘의 기분</label>
            <div className="flex gap-1 flex-wrap">
              {MOOD_EMOJIS.map(e => (
                <button
                  key={e}
                  className={`retro-btn px-2 py-1 text-lg${moodEmoji === e ? ' retro-btn-primary' : ''}`}
                  onClick={() => setMoodEmoji(e)}
                  aria-label={e}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-[Geist,monospace] text-[12px] font-semibold text-[#5a4136]">소개글</label>
            <textarea
              className="window-inset p-2 text-[14px] focus:outline-none w-full resize-none"
              rows={3}
              maxLength={200}
              placeholder="자신을 소개해보세요"
              value={introduction}
              onChange={(e) => setIntroduction(e.target.value)}
            />
            <span className="font-[Geist,monospace] text-[10px] text-[#5a4136] text-right">{introduction.length}/200</span>
          </div>
        </div>

        {error && <p className="px-3 py-1 font-[Geist,monospace] text-[12px] text-[#ba1a1a] border-t border-[#8e7164]">{error}</p>}

        <div className="px-3 py-2 border-t border-[#8e7164] flex gap-2 flex-shrink-0">
          <button className="retro-btn font-[Geist,monospace] text-[12px] font-semibold px-4 py-2 flex-1" onClick={onClose} disabled={isSaving}>취소</button>
          <button className="retro-btn retro-btn-primary font-[Geist,monospace] text-[12px] font-semibold px-4 py-2 flex-1" onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  )
}