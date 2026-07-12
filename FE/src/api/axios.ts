import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`

  // TODO: JWT 인증 구현 후 제거 — 서버가 토큰에서 userId 추출하게 될 예정
  const userId = localStorage.getItem('userId')
  if (userId) config.headers['X-User-Id'] = userId

  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken')
      window.location.href = '/auth/login'
    }
    return Promise.reject(error)
  }
)

export default api
