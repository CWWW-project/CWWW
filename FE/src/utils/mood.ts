// 이모지만 추출 (레거시 "이모지 텍스트" 형식 데이터도 안전하게 처리)
export function parseMoodEmoji(mood?: string | null): string {
  if (!mood) return '😊'
  const trimmed = mood.trim()
  const spaceIdx = trimmed.indexOf(' ')
  return spaceIdx === -1 ? trimmed : trimmed.slice(0, spaceIdx)
}

// 기분 이모지 목록
export const MOOD_EMOJIS = ['😊', '😢', '😡', '😴', '🥳', '😍', '😐', '🤔']