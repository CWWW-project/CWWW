import { create } from 'zustand'

interface User {
  id: number
  email: string
  nickname: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  setAuth: (user: User, token: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: localStorage.getItem('accessToken'),
  setAuth: (user, token) => {
    localStorage.setItem('accessToken', token)
    localStorage.setItem('userId', String(user.id))
    set({ user, accessToken: token })
  },
  clearAuth: () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('userId')
    set({ user: null, accessToken: null })
  },
}))
