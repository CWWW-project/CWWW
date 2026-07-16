import { create } from 'zustand'

interface User {
  id: number
  email: string
  nickname: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  setAuth: (user: User, token: string, refreshToken?: string) => void
  setAccessToken: (token: string) => void
  setUser: (user: User) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: localStorage.getItem('accessToken'),
  setAuth: (user, token, refreshToken) => {
    localStorage.setItem('accessToken', token)
    localStorage.setItem('userId', String(user.id))
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken)
    set({ user, accessToken: token })
  },
  setAccessToken: (token) => {
    localStorage.setItem('accessToken', token)
    set({ accessToken: token })
  },
  setUser: (user) => {
    set({ user })
  },
  clearAuth: () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('userId')
    set({ user: null, accessToken: null })
  },
}))
