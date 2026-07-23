interface Props {
  onClose: () => void
  onChange: () => void
  onDelete: () => void
}

export default function ProfileImageMenuModal({
  onClose,
  onChange,
  onDelete,
}: Props) {
  return (
    <div className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center">
      <div className="window-frame w-64">
        <div className="bg-[#e2e2e2] px-3 py-2 border-b border-[#8e7164] font-semibold">
          프로필 사진
        </div>

        <div className="flex flex-col p-2 gap-2">
          <button
            className="retro-btn py-2"
            onClick={onChange}
          >
            사진 변경
          </button>

          <button
            className="retro-btn py-2 text-red-600"
            onClick={onDelete}
          >
            사진 삭제
          </button>

          <button
            className="retro-btn py-2"
            onClick={onClose}
          >
            취소
          </button>
        </div>
      </div>
    </div>
  )
}