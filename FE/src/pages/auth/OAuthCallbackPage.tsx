import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export default function OAuthCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setAuth } = useAuthStore()

  useEffect(() => {
    const accessToken = searchParams.get('accessToken')
    const userId = searchParams.get('userId')
    const nickname = searchParams.get('nickname')

    if (accessToken && userId && nickname) {
      setAuth({ id: Number(userId), email: '', nickname }, accessToken)
      navigate('/', { replace: true })
    } else {
      navigate('/auth/login?error=oauth', { replace: true })
    }
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
