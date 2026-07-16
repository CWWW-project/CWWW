import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { authApi } from '../../api/auth'
import { useAuthStore } from '../../store/authStore'

// 모듈 레벨 Set: StrictMode 리마운트에도 초기화되지 않아 이중 교환 방지
const processedCodes = new Set<string>()

export default function OAuthCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setAuth } = useAuthStore()

  useEffect(() => {
    const code = searchParams.get('code')
    if (!code) {
      navigate('/auth/login?error=oauth', { replace: true })
      return
    }
    if (processedCodes.has(code)) return
    processedCodes.add(code)

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
