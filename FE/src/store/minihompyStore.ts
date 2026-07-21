import { create } from 'zustand'
import type { MinihompyMainResponse } from '../types'
import { stopAudio } from './audioPlayer'

interface MinihompyState {
  main: MinihompyMainResponse | null
  setMain: (main: MinihompyMainResponse | null) => void
  clearMain: () => void
  myProfileImageUrl: string | null
  myProfileImageVersion: number
  setMyProfileImageUrl: (url: string | null) => void
}

function applyBackground(main: MinihompyMainResponse | null) {
  if (!main) {
    document.body.style.backgroundColor = '#89d0ed'
    document.body.style.backgroundImage = 'radial-gradient(#baeaff 2px, transparent 2px)'
    document.body.style.backgroundSize = '16px 16px'
    document.body.style.backgroundPosition = ''
    return
  }

  if (main.backgroundImageUrl) {
    document.body.style.backgroundImage = `url(${main.backgroundImageUrl})`
    document.body.style.backgroundSize = 'cover'
    document.body.style.backgroundPosition = 'center'
  } else {
    document.body.style.backgroundColor = main.backgroundColor ?? '#89d0ed'
    document.body.style.backgroundImage = 'radial-gradient(rgba(255,255,255,0.5) 2px, transparent 2px)'
    document.body.style.backgroundSize = '16px 16px'
    document.body.style.backgroundPosition = ''
  }
}

export const useMinihompyStore = create<MinihompyState>((set) => ({
  main: null,
  setMain: (main) => {
    applyBackground(main)
    set({ main })
  },
  clearMain: () => {
    applyBackground(null)
    stopAudio()
    set({ main: null })
  },
  myProfileImageUrl: null,
  myProfileImageVersion: 0,
  setMyProfileImageUrl: (url) =>
    set(state => ({ myProfileImageUrl: url, myProfileImageVersion: state.myProfileImageVersion + 1 })),
}))