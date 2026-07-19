let audioEl: HTMLAudioElement | null = null

export function getAudioElement(): HTMLAudioElement {
  if (!audioEl) {
    audioEl = new Audio()
    audioEl.loop = true
    audioEl.volume = 0.7
  }
  return audioEl
}

// 추가: 오디오 정지 + 소스 초기화
export function stopAudio() {
  if (audioEl) {
    audioEl.pause()
    audioEl.src = ''
  }
}