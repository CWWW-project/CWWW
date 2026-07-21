import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

interface Props {
  userId: number
  nickname: string
  className?: string
}

export default function UserNameLink({ userId, nickname, className }: Props) {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [showConfirm, setShowConfirm] = useState(false)
  const isSelf = user?.id === userId

  if (isSelf) {
    return <span className={className}>{nickname}</span>
  }

  return (
    <>
      <button
        type="button"
        className={className ?? 'cursor-pointer hover:underline'}
        onClick={() => setShowConfirm(true)}
      >
        {nickname}
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 px-2" onClick={() => setShowConfirm(false)}>
          <div className="window-frame bg-[#f9f9f9] p-4 flex flex-col gap-3 max-w-xs" onClick={e => e.stopPropagation()}>
            <p className="font-[Geist,monospace] text-[13px] text-[#1a1c1c] text-center">
              <span className="font-bold text-[#a33e00]">{nickname}</span>님의 미니홈피로 이동할까요?
            </p>
            <div className="flex gap-2">
              <button className="retro-btn font-[Geist,monospace] text-[12px] font-semibold px-4 py-2 flex-1" onClick={() => setShowConfirm(false)}>
                취소
              </button>
              <button
                className="retro-btn retro-btn-primary font-[Geist,monospace] text-[12px] font-semibold px-4 py-2 flex-1"
                onClick={() => navigate(`/home/${userId}`)}
              >
                이동
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}