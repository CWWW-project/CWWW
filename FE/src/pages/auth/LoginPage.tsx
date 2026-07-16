import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { authApi } from '../../api/auth'
import { useAuthStore } from '../../store/authStore'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

type Tab = 'login' | 'signup'

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setAuth } = useAuthStore()

  const [tab, setTab] = useState<Tab>('login')
  const [showPw, setShowPw] = useState(false)
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (searchParams.get('error') === 'oauth') {
      setIsSuccess(false)
      setMessage('소셜 로그인에 실패했습니다. 다시 시도해 주세요.')
    }
  }, [])

  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [signupForm, setSignupForm] = useState({ email: '', password: '', confirmPassword: '', nickname: '' })

  const handleLogin = async () => {
    if (isSubmitting) return
    setMessage('')
    setIsSubmitting(true)
    try {
      const res = await authApi.login({ email: loginForm.email, password: loginForm.password })
      const { accessToken, refreshToken, userId, nickname } = res.data.data
      setAuth({ id: userId, email: loginForm.email, nickname }, accessToken, refreshToken)
      navigate('/')
    } catch (e: any) {
      setIsSuccess(false)
      setMessage(e.response?.data?.message ?? '로그인에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSignup = async () => {
    if (isSubmitting) return
    setMessage('')
    if (signupForm.password !== signupForm.confirmPassword) {
      setIsSuccess(false)
      setMessage('비밀번호가 일치하지 않습니다.')
      return
    }
    setIsSubmitting(true)
    try {
      await authApi.signup({
        email: signupForm.email,
        password: signupForm.password,
        nickname: signupForm.nickname,
      })
      setTab('login')
      setLoginForm({ email: signupForm.email, password: '' })
      setIsSuccess(true)
      setMessage('회원가입 완료! 로그인해주세요.')
    } catch (e: any) {
      setIsSuccess(false)
      setMessage(e.response?.data?.message ?? '회원가입에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 gap-6 px-4">
      {/* 브랜드 */}
      <div className="text-center">
        <h1 style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 36, fontWeight: 700, color: 'var(--c-navy)', letterSpacing: -2 }}>
          싸이<span style={{ color: 'var(--c-mid)' }}>월드</span>
        </h1>
        <p style={{ fontFamily: 'Noto Sans KR, sans-serif', fontSize: 13, color: 'var(--c-sub)', marginTop: 6 }}>
          나만의 공간으로 돌아오세요 🌸
        </p>
      </div>

      {/* Auth Card */}
      <div className="c-card w-full" style={{ maxWidth: 360 }}>
        {/* Tabs */}
        <div className="c-card-header">
          <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--c-light)' }}>lock</span>
          <span>회원 인증</span>
          <div className="flex gap-1 ml-auto">
            {(['login', 'signup'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setMessage('') }}
                className="c-filter-pill"
                style={tab === t
                  ? { background: 'rgba(255,255,255,0.2)', color: '#fff', borderColor: 'rgba(255,255,255,0.3)', fontSize: 11 }
                  : { background: 'transparent', color: '#a8ccee', borderColor: 'rgba(255,255,255,0.15)', fontSize: 11 }
                }
              >
                {t === 'login' ? '로그인' : '회원가입'}
              </button>
            ))}
          </div>
        </div>

        {/* 메시지 */}
        {message && (
          <div style={{ padding: '10px 16px 0', fontFamily: 'Noto Sans KR', fontSize: 12, color: isSuccess ? 'var(--c-mid)' : '#dc2626' }}>
            {message}
          </div>
        )}

        {/* Login Form */}
        {tab === 'login' && (
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="flex flex-col gap-1">
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-navy)' }}>이메일</label>
              <div className="flex items-center gap-2 c-input" style={{ padding: '8px 12px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--c-sub)' }}>mail</span>
                <input
                  type="email"
                  placeholder="example@email.com"
                  value={loginForm.email}
                  onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'Noto Sans KR', fontSize: 14, color: 'var(--c-text)' }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-navy)' }}>비밀번호</label>
              <div className="flex items-center gap-2 c-input" style={{ padding: '8px 12px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--c-sub)' }}>lock</span>
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="비밀번호 입력"
                  value={loginForm.password}
                  onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'Noto Sans KR', fontSize: 14, color: 'var(--c-text)' }}
                />
                <button
                  onClick={() => setShowPw(!showPw)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--c-sub)' }}>
                    {showPw ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <button
              className="c-sb-btn c-sb-btn--primary"
              onClick={handleLogin}
              disabled={isSubmitting}
              style={{ borderRadius: 20, padding: '10px 0', fontSize: 14 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>login</span>
              {isSubmitting ? '로그인 중...' : '로그인'}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div style={{ flex: 1, borderTop: '1px solid var(--c-card-border)' }} />
              <span style={{ fontSize: 11, color: 'var(--c-sub)', fontFamily: 'IBM Plex Mono' }}>또는</span>
              <div style={{ flex: 1, borderTop: '1px solid var(--c-card-border)' }} />
            </div>

            {/* GitHub */}
            <button
              className="c-sb-btn"
              style={{ background: '#24292e', borderColor: '#24292e', color: '#fff', borderRadius: 20, padding: '10px 0' }}
              onClick={() => { window.location.href = `${API_URL}/oauth2/authorization/github` }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              GitHub으로 시작하기
            </button>

            {/* Google */}
            <button
              className="c-sb-btn c-sb-btn--outline"
              style={{ borderRadius: 20, padding: '10px 0' }}
              onClick={() => { window.location.href = `${API_URL}/oauth2/authorization/google` }}
            >
              <svg width="16" height="16" viewBox="0 0 18 18">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
              </svg>
              구글로 시작하기
            </button>
          </div>
        )}

        {/* Signup Form */}
        {tab === 'signup' && (
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: '이메일', icon: 'mail', type: 'email', placeholder: '이메일 주소', field: 'email' },
              { label: '닉네임', icon: 'badge', type: 'text', placeholder: '사용할 닉네임 (2~20자)', field: 'nickname' },
              { label: '비밀번호', icon: 'lock', type: 'password', placeholder: '영문+숫자 포함 8~20자', field: 'password' },
              { label: '비밀번호 확인', icon: 'lock_reset', type: 'password', placeholder: '비밀번호 재입력', field: 'confirmPassword' },
            ].map(({ label, icon, type, placeholder, field }) => (
              <div key={field} className="flex flex-col gap-1">
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-navy)' }}>{label}</label>
                <div className="flex items-center gap-2 c-input" style={{ padding: '8px 12px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--c-sub)' }}>{icon}</span>
                  <input
                    type={type}
                    placeholder={placeholder}
                    value={signupForm[field as keyof typeof signupForm]}
                    onChange={e => setSignupForm(f => ({ ...f, [field]: e.target.value }))}
                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'Noto Sans KR', fontSize: 14, color: 'var(--c-text)' }}
                  />
                </div>
              </div>
            ))}
            <button
              className="c-sb-btn c-sb-btn--primary"
              onClick={handleSignup}
              disabled={isSubmitting}
              style={{ borderRadius: 20, padding: '10px 0', fontSize: 14 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person_add</span>
              {isSubmitting ? '처리 중...' : '회원가입'}
            </button>
          </div>
        )}
      </div>

      <button
        onClick={() => navigate('/')}
        style={{ fontSize: 12, color: 'var(--c-sub)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
      >
        로그인 없이 둘러보기
      </button>
    </div>
  )
}
