import { create } from 'zustand'

export interface User {
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
  setAuth: (user, token) => {
    localStorage.setItem('accessToken', token)
    localStorage.setItem('userId', String(user.id))
    localStorage.setItem('userEmail', user.email)
    localStorage.setItem('userNickname', user.nickname)
    set({ user, accessToken: token })
  },
  clearAuth: () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('userId')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('userNickname')
    set({ user: null, accessToken: null })
  },
}))
