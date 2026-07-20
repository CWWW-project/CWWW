import { create } from 'zustand'

export interface User {
  id: number
  email: string
  nickname: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  setAuth: (user: User, accessToken: string, refreshToken?: string | null) => void
  setAccessToken: (accessToken: string, refreshToken?: string | null) => void
  clearAuth: () => void
}

function getStoredUser(): User | null {
  const id = localStorage.getItem('userId')
  const email = localStorage.getItem('userEmail')
  const nickname = localStorage.getItem('userNickname')

  if (!id || !email || !nickname) {
    return null
  }

  return {
    id: Number(id),
    email,
    nickname,
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: getStoredUser(),
  accessToken: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  setAuth: (user, accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('userId', String(user.id))
    localStorage.setItem('userEmail', user.email)
    localStorage.setItem('userNickname', user.nickname)
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken)
    set({ user, accessToken, refreshToken: refreshToken ?? null })
  },
  setAccessToken: (accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken)
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken)
    set(state => ({ accessToken, refreshToken: refreshToken ?? state.refreshToken }))
  },
  clearAuth: () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('userId')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('userNickname')
    set({ user: null, accessToken: null, refreshToken: null })
  },
}))
