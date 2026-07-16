import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { authApi } from '../../api/auth'
import { useAuthStore } from '../../store/authStore'

export default function OAuthCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setAuth } = useAuthStore()
  const called = useRef(false)

  useEffect(() => {
    // StrictMode 이중 실행 방지
    if (called.current) return
    called.current = true

    const code = searchParams.get('code')
    if (!code) {
      navigate('/auth/login?error=oauth', { replace: true })
      return
    }

    authApi.exchangeOAuthCode(code)
      .then(res => {
        const { accessToken, userId, nickname } = res.data.data
        setAuth({ id: userId, email: '', nickname }, accessToken)
        navigate('/', { replace: true })
      })
      .catch(() => {
        navigate('/auth/login?error=oauth', { replace: true })
      })
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="window-frame p-6 flex flex-col items-center gap-3">
        <span className="material-symbols-outlined text-[32px] text-[#a33e00] animate-spin">autorenew</span>
        <p className="font-[Geist,monospace] text-[13px] text-[#5a4136]">소셜 로그인 처리 중...</p>
      </div>
    </div>
  )
}
