import { create } from 'zustand'

interface User {
  id: number
  email: string
  nickname: string
  role: string
}

interface AuthState {
  user: User | null
  isLoggedIn: boolean
  accessToken: string | null
  refreshToken: string | null

  setUser: (user: User | null) => void
  setAuth: (user: User, accessToken: string, refreshToken?: string | null) => void
  setAccessToken: (accessToken: string, refreshToken?: string | null) => void
  clearAuth: () => void
  logout: () => void
}

function getStoredUser(): User | null {
  const id = localStorage.getItem('userId')
  const email = localStorage.getItem('userEmail')
  const nickname = localStorage.getItem('userNickname')
  const role = localStorage.getItem('userRole')

  if (!id || !email || !nickname || !role) {
    return null
  }

  return {
    id: Number(id),
    email,
    nickname,
    role,
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: getStoredUser(),
  isLoggedIn: getStoredUser() !== null,
  accessToken: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),

  setUser: (user) => {
    set({ user, isLoggedIn: user !== null })

    if (user) {
      localStorage.setItem('userId', String(user.id))
      localStorage.setItem('userEmail', user.email)
      localStorage.setItem('userNickname', user.nickname)
      localStorage.setItem('userRole', user.role)
    }
  },

  setAuth: (user, accessToken, refreshToken) => {
    set({ user, accessToken, refreshToken, isLoggedIn: true })
    localStorage.setItem('userId', String(user.id))
    localStorage.setItem('userEmail', user.email)
    localStorage.setItem('userNickname', user.nickname)
    localStorage.setItem('userRole', user.role)
    localStorage.setItem('accessToken', accessToken)
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken)
    }
  },

  setAccessToken: (accessToken, refreshToken) => {
    set({ accessToken, refreshToken: refreshToken ?? undefined })
    localStorage.setItem('accessToken', accessToken)
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken)
    }
  },

  clearAuth: () => {
    set({ user: null, accessToken: null, refreshToken: null, isLoggedIn: false })
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('userId')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('userNickname')
    localStorage.removeItem('userRole')
  },

  logout: () => {
    set({ user: null, accessToken: null, refreshToken: null, isLoggedIn: false })
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('userId')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('userNickname')
    localStorage.removeItem('userRole')
    window.location.href = '/auth/login'
  },
}))