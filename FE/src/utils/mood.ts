// 이모지와 텍스트 구분
export function parseMood(mood?: string | null): { emoji: string; text: string } {
  if (!mood) return { emoji: '😊', text: '알 수 없음' }
  const trimmed = mood.trim()
  const spaceIdx = trimmed.indexOf(' ')
  if (spaceIdx === -1) return { emoji: trimmed, text: '' }
  return { emoji: trimmed.slice(0, spaceIdx), text: trimmed.slice(spaceIdx + 1) }
}

// 기분 이모지 목록
export const MOOD_EMOJIS = ['😊', '😢', '😡', '😴', '🥳', '😍', '😐', '🤔']