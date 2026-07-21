import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../../api/auth'
import { useAuthStore } from '../../store/authStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await authApi.login({ email, password })
      
      // ← 이 부분 추가! (setAuth 호출)
      useAuthStore.getState().setAuth(
        {
          id: response.data.data.userId,
          email: response.data.data.email,
          nickname: response.data.data.nickname,
          role: response.data.data.role
        },
        response.data.data.accessToken
      )

      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.message || '로그인에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-200 to-blue-200 p-4">
      <div className="window-frame p-8 w-full max-w-md">
        <h1 className="text-center font-['Bricolage_Grotesque',sans-serif] text-3xl font-bold text-[#a33e00] mb-6">
          싸이월드
        </h1>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label htmlFor="login-email" className="block font-[Geist,monospace] text-sm font-semibold text-[#5a4136] mb-2">
              이메일
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@gmail.com"
              className="window-inset w-full px-3 py-2 focus:outline-none"
              required
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block font-[Geist,monospace] text-sm font-semibold text-[#5a4136] mb-2">
              비밀번호
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="window-inset w-full px-3 py-2 focus:outline-none"
              required
            />
          </div>

          {error && (
            <div className="bg-[#ffcccc] border border-[#ba1a1a] text-[#ba1a1a] px-3 py-2 font-[Geist,monospace] text-sm rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="retro-btn retro-btn-primary font-[Geist,monospace] font-semibold py-2 px-4 mt-4"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="text-center mt-6">
          <button
            type="button"
            onClick={() => navigate('/auth/signup')}
            className="text-[#a33e00] hover:underline font-[Geist,monospace] text-sm"
          >
            회원가입
          </button>
        </div>
      </div>
    </div>
  )
}