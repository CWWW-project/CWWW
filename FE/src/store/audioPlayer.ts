let audioEl: HTMLAudioElement | null = null

export function getAudioElement(): HTMLAudioElement {
  if (!audioEl) {
    audioEl = new Audio()
    audioEl.loop = true
    audioEl.volume = 0.7
  }
  return audioEl
}