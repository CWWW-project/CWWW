// authStore.ts
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
  setUser: (user: User | null) => void
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
  
  setUser: (user) => {
    set({ user, isLoggedIn: user !== null })
    
    if (user) {
      localStorage.setItem('userId', String(user.id))
      localStorage.setItem('userEmail', user.email)
      localStorage.setItem('userNickname', user.nickname)
      localStorage.setItem('userRole', user.role)
    }
  },
  
  logout: () => {
    set({ user: null, isLoggedIn: false })
    localStorage.removeItem('userId')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('userNickname')
    localStorage.removeItem('userRole')
  },
}))