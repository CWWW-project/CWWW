import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { authApi } from '../../api/auth'
import { useAuthStore } from '../../store/authStore'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

type Tab = 'login' | 'signup'
type SignupStep = 'email' | 'verify' | 'form'

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setAuth } = useAuthStore()

  const [tab, setTab] = useState<Tab>('login')
  const [signupStep, setSignupStep] = useState<SignupStep>('email')
  const [signupEmail, setSignupEmail] = useState('')
  const [verifyCode, setVerifyCode] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showSignupPw, setShowSignupPw] = useState(false)
  const [showSignupConfirmPw, setShowSignupConfirmPw] = useState(false)
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [signupForm, setSignupForm] = useState({ nickname: '', password: '', confirmPassword: '' })

  useEffect(() => {
    if (searchParams.get('error') === 'oauth') {
      setIsSuccess(false)
      setMessage('소셜 로그인에 실패했습니다. 다시 시도해 주세요.')
    }
  }, [])

  const resetSignup = () => {
    setSignupStep('email')
    setSignupEmail('')
    setVerifyCode('')
    setSignupForm({ nickname: '', password: '', confirmPassword: '' })
    setMessage('')
  }

  const handleLogin = async () => {
    if (isSubmitting) return
    setMessage('')
    setIsSubmitting(true)
    try {
      const res = await authApi.login({ email: loginForm.email, password: loginForm.password })
      const { accessToken, userId, nickname } = res.data.data
      setAuth({ id: userId, email: loginForm.email, nickname }, accessToken)
      navigate('/')
    } catch (e: any) {
      setIsSuccess(false)
      setMessage(e.response?.data?.message ?? '로그인에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // step 1: 인증번호 발송
  const handleSendCode = async () => {
    if (isSubmitting) return
    if (!signupEmail) {
      setIsSuccess(false)
      setMessage('이메일을 입력해주세요.')
      return
    }
    setMessage('')
    setIsSubmitting(true)
    try {
      await authApi.sendEmailCode(signupEmail)
      setSignupStep('verify')
      setIsSuccess(true)
      setMessage(`${signupEmail}로 인증 코드를 보냈어요.`)
    } catch (e: any) {
      setIsSuccess(false)
      setMessage(e.response?.data?.message ?? '인증 코드 발송에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // step 2: 인증 코드 확인
  const handleVerifyCode = async () => {
    if (isSubmitting) return
    setMessage('')
    setIsSubmitting(true)
    try {
      await authApi.verifyEmailCode(signupEmail, verifyCode)
      setVerifyCode('')
      setSignupStep('form')
      setIsSuccess(true)
      setMessage('이메일 인증 완료! 나머지 정보를 입력해주세요.')
    } catch (e: any) {
      setIsSuccess(false)
      setMessage(e.response?.data?.message ?? '인증 코드가 올바르지 않습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // step 3: 회원가입
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
        email: signupEmail,
        password: signupForm.password,
        nickname: signupForm.nickname,
      })
      setTab('login')
      resetSignup()
      setLoginForm(f => ({ ...f, email: signupEmail }))
      setIsSuccess(true)
      setMessage('회원가입 완료! 로그인해주세요.')
    } catch (e: any) {
      setIsSuccess(false)
      setMessage(e.response?.data?.message ?? '회원가입에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const stepLabel = signupStep === 'email' ? '1/3 이메일 인증'
    : signupStep === 'verify' ? '2/3 코드 확인'
    : '3/3 정보 입력'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 gap-6">
      {/* 브랜드 */}
      <div className="text-center">
        <h1 style={{ fontFamily: 'Bricolage Grotesque', fontSize: 36, fontWeight: 800, color: '#7c2e00', letterSpacing: -1 }}>
          싸이월드
        </h1>
        <p style={{ fontFamily: 'Be Vietnam Pro', fontSize: 14, color: '#360f00', marginTop: 4 }}>
          나만의 공간으로 돌아오세요 🌸
        </p>
      </div>

      {/* Auth Card */}
      <div className="window-frame w-full max-w-sm">
        {/* Title Bar */}
        <div className="retro-title-bar">
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>lock</span>
          <span>회원 인증</span>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '2px solid #8e7164', padding: '8px 8px 0', gap: 4 }}>
          {(['login', 'signup'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); resetSignup(); setMessage('') }}
              style={{
                borderTop: '1px solid #a0a0a0',
                borderLeft: '1px solid #a0a0a0',
                borderRight: '1px solid #a0a0a0',
                borderBottom: 'none',
                background: tab === t ? '#f9f9f9' : '#d0d0d0',
                color: tab === t ? '#a33e00' : '#1a1c1c',
                fontWeight: tab === t ? 700 : 400,
                fontFamily: 'Geist, monospace',
                fontSize: 12,
                padding: '4px 16px',
                cursor: 'pointer',
              }}
            >
              {t === 'login' ? '로그인' : '회원가입'}
            </button>
          ))}
        </div>

        {/* 에러/성공 메시지 */}
        {message && (
          <p style={{ margin: '8px 16px 0', fontFamily: 'Geist, monospace', fontSize: 12, color: isSuccess ? '#0c6780' : '#ba1a1a' }}>
            {message}
          </p>
        )}

        {/* ── Login Form ── */}
        {tab === 'login' && (
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontFamily: 'Geist, monospace', fontSize: 12, fontWeight: 600 }}>이메일</label>
              <div className="window-inset" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#5a4136' }}>mail</span>
                <input
                  type="email"
                  placeholder="example@email.com"
                  value={loginForm.email}
                  onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'Be Vietnam Pro', fontSize: 14 }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontFamily: 'Geist, monospace', fontSize: 12, fontWeight: 600 }}>비밀번호</label>
              <div className="window-inset" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#5a4136' }}>lock</span>
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="비밀번호 입력"
                  value={loginForm.password}
                  onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'Be Vietnam Pro', fontSize: 14 }}
                />
                <button onClick={() => setShowPw(!showPw)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#5a4136' }}>
                    {showPw ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>
            <button
              className="retro-btn retro-btn-primary"
              onClick={handleLogin}
              disabled={isSubmitting}
              style={{ width: '100%', padding: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>login</span>
              {isSubmitting ? '로그인 중...' : '로그인'}
            </button>

            <Link
              to="/auth/forgot-password"
              style={{ fontFamily: 'Geist, monospace', fontSize: 12, color: '#5a4136', textAlign: 'center', textDecoration: 'underline' }}
            >
              비밀번호를 잊으셨나요?
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, borderTop: '1px solid #e3bfb1' }} />
              <span style={{ fontFamily: 'Geist, monospace', fontSize: 12, color: '#5a4136' }}>또는</span>
              <div style={{ flex: 1, borderTop: '1px solid #e3bfb1' }} />
            </div>

            <button
              className="retro-btn"
              style={{ width: '100%', padding: '8px 0', background: '#24292e', borderColor: '#24292e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              onClick={() => { window.location.href = `${API_URL}/oauth2/authorization/github` }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              GitHub으로 시작하기
            </button>
            <button
              className="retro-btn"
              style={{ width: '100%', padding: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              onClick={() => { window.location.href = `${API_URL}/oauth2/authorization/google` }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              구글로 시작하기
            </button>
          </div>
        )}

        {/* ── Signup: Step 1 - 이메일 입력 + 발송 ── */}
        {tab === 'signup' && signupStep === 'email' && (
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontFamily: 'Geist, monospace', fontSize: 11, color: '#8a6a5e' }}>{stepLabel}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontFamily: 'Geist, monospace', fontSize: 12, fontWeight: 600 }}>이메일</label>
              <div className="window-inset" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#5a4136' }}>mail</span>
                <input
                  type="email"
                  placeholder="이메일 주소"
                  value={signupEmail}
                  onChange={e => setSignupEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendCode()}
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'Be Vietnam Pro', fontSize: 14 }}
                />
              </div>
            </div>
            <button
              className="retro-btn retro-btn-primary"
              onClick={handleSendCode}
              disabled={isSubmitting}
              style={{ width: '100%', padding: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>send</span>
              {isSubmitting ? '발송 중...' : '인증번호 발송'}
            </button>
          </div>
        )}

        {/* ── Signup: Step 2 - 코드 입력 + 확인 ── */}
        {tab === 'signup' && signupStep === 'verify' && (
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontFamily: 'Geist, monospace', fontSize: 11, color: '#8a6a5e' }}>{stepLabel}</p>
            <p style={{ fontFamily: 'Be Vietnam Pro', fontSize: 13, color: '#5a4136' }}>
              <strong>{signupEmail}</strong>로 보낸 6자리 코드를 입력해주세요.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontFamily: 'Geist, monospace', fontSize: 12, fontWeight: 600 }}>인증 코드</label>
              <div className="window-inset" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#5a4136' }}>pin</span>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="6자리 숫자"
                  value={verifyCode}
                  onChange={e => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onKeyDown={e => e.key === 'Enter' && verifyCode.length === 6 && handleVerifyCode()}
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'Be Vietnam Pro', fontSize: 14, letterSpacing: 4 }}
                />
              </div>
            </div>
            <button
              className="retro-btn retro-btn-primary"
              onClick={handleVerifyCode}
              disabled={isSubmitting || verifyCode.length !== 6}
              style={{ width: '100%', padding: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>verified</span>
              {isSubmitting ? '확인 중...' : '인증 확인'}
            </button>
            <button
              onClick={handleSendCode}
              disabled={isSubmitting}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Geist, monospace', fontSize: 12, color: '#5a4136', textDecoration: 'underline' }}
            >
              코드 재전송
            </button>
            <button
              onClick={() => { setSignupStep('email'); setVerifyCode(''); setMessage('') }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Geist, monospace', fontSize: 12, color: '#8a6a5e', textDecoration: 'underline' }}
            >
              이메일 다시 입력
            </button>
          </div>
        )}

        {/* ── Signup: Step 3 - 닉네임/비밀번호 입력 ── */}
        {tab === 'signup' && signupStep === 'form' && (
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontFamily: 'Geist, monospace', fontSize: 11, color: '#8a6a5e' }}>{stepLabel}</p>
            {[
              { label: '닉네임', icon: 'badge', type: 'text', placeholder: '사용할 닉네임 (2~20자)', field: 'nickname' },
              { label: '비밀번호', icon: 'lock', type: 'password', placeholder: '영문+숫자 포함 8~20자', field: 'password' },
              { label: '비밀번호 확인', icon: 'lock_reset', type: 'password', placeholder: '비밀번호 재입력', field: 'confirmPassword' },
            ].map(({ label, icon, type, placeholder, field }) => {
              const isPwField = field === 'password' || field === 'confirmPassword'
              const showThisPw = field === 'password' ? showSignupPw : showSignupConfirmPw
              const toggleThisPw = field === 'password' ? () => setShowSignupPw(v => !v) : () => setShowSignupConfirmPw(v => !v)
              return (
                <div key={field} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontFamily: 'Geist, monospace', fontSize: 12, fontWeight: 600 }}>{label}</label>
                  <div className="window-inset" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#5a4136' }}>{icon}</span>
                    <input
                      type={isPwField ? (showThisPw ? 'text' : 'password') : type}
                      placeholder={placeholder}
                      value={signupForm[field as keyof typeof signupForm]}
                      onChange={e => setSignupForm(f => ({ ...f, [field]: e.target.value }))}
                      style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'Be Vietnam Pro', fontSize: 14 }}
                    />
                    {isPwField && (
                      <button onClick={toggleThisPw} type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#5a4136' }}>
                          {showThisPw ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
            <button
              className="retro-btn retro-btn-primary"
              onClick={handleSignup}
              disabled={isSubmitting}
              style={{ width: '100%', padding: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person_add</span>
              {isSubmitting ? '처리 중...' : '회원가입'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
