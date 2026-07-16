import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let isRefreshing = false
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = []

const flushQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token!))
  failedQueue = []
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }

    // 동시 다발 401: 큐에 쌓아두고 재발급 완료 후 재시도
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then(token => {
        original.headers.Authorization = `Bearer ${token}`
        return api(original)
      })
    }

    original._retry = true
    isRefreshing = true

    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) {
      useAuthStore.getState().clearAuth()
      window.location.href = '/auth/login'
      return Promise.reject(error)
    }

    try {
      // api 인스턴스 대신 axios 직접 사용 → 인터셉터 무한루프 방지
      const { data } = await axios.post('/api/auth/refresh', { refreshToken })
      const { accessToken, refreshToken: newRt } = data.data as { accessToken: string; refreshToken: string }
      localStorage.setItem('refreshToken', newRt)
      useAuthStore.getState().setAccessToken(accessToken)
      flushQueue(null, accessToken)
      original.headers.Authorization = `Bearer ${accessToken}`
      return api(original)
    } catch (err) {
      flushQueue(err)
      useAuthStore.getState().clearAuth()
      window.location.href = '/auth/login'
      return Promise.reject(err)
    } finally {
      isRefreshing = false
    }
  }
)

export default api
