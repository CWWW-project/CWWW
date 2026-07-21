import { create } from 'zustand'

export interface User {
  id: number
  email: string
  nickname: string
  role: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  setAuth: (user: User, accessToken: string) => void
  setAccessToken: (accessToken: string) => void
  clearAuth: () => void
}

function getStoredUser(): User | null {
  const id = localStorage.getItem('userId')
  const email = localStorage.getItem('userEmail')
  const nickname = localStorage.getItem('userNickname')
  const role = localStorage.getItem('userRole')

  if (id === null || email === null || nickname === null) {
    return null
  }

  return {
    id: Number(id),
    email,
    nickname,
    role: role ?? 'USER',
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: getStoredUser(),
  accessToken: localStorage.getItem('accessToken'),
  setAuth: (user, accessToken) => {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('userId', String(user.id))
    localStorage.setItem('userEmail', user.email)
    localStorage.setItem('userNickname', user.nickname)
    localStorage.setItem('userRole', user.role)
    set({ user, accessToken })
  },
  setAccessToken: (accessToken) => {
    localStorage.setItem('accessToken', accessToken)
    set({ accessToken })
  },
  clearAuth: () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('userId')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('userNickname')
    localStorage.removeItem('userRole')
    set({ user: null, accessToken: null })
  },
}))
