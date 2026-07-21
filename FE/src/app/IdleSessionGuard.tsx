import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { refreshAccessToken } from '../api/axios'
import { useAuthStore } from '../store/authStore'

// 활동 중엔 access token이 계속 갱신되므로 BE의 jwt.expiration(30분)과 무관하게 자유롭게 조정 가능
const IDLE_LIMIT_MS = 2 * 60 * 60 * 1000
const REFRESH_THROTTLE_MS = 5 * 60 * 1000
const CHECK_INTERVAL_MS = 30 * 1000
const ACTIVITY_EVENTS = ['click', 'keydown', 'scroll', 'touchstart'] as const

export function IdleSessionGuard() {
  const navigate = useNavigate()
  const accessToken = useAuthStore(state => state.accessToken)
  const lastActivityAtRef = useRef(Date.now())
  const lastRefreshAtRef = useRef(0)

  useEffect(() => {
    if (!accessToken) return

    lastActivityAtRef.current = Date.now()

    const handleActivity = () => {
      lastActivityAtRef.current = Date.now()
      if (Date.now() - lastRefreshAtRef.current >= REFRESH_THROTTLE_MS) {
        lastRefreshAtRef.current = Date.now()
        refreshAccessToken()
      }
    }

    ACTIVITY_EVENTS.forEach(event => document.addEventListener(event, handleActivity))

    const interval = window.setInterval(() => {
      if (Date.now() - lastActivityAtRef.current >= IDLE_LIMIT_MS) {
        useAuthStore.getState().clearAuth()
        navigate('/auth/login', { replace: true })
      }
    }, CHECK_INTERVAL_MS)

    return () => {
      ACTIVITY_EVENTS.forEach(event => document.removeEventListener(event, handleActivity))
      window.clearInterval(interval)
    }
  }, [accessToken])

  return null
}
