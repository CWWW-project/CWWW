import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { authApi } from '../../api/auth'
import { useAuthStore } from '../../store/authStore'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

type Tab = 'login' | 'signup'

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { setAuth } = useAuthStore()

  const [tab, setTab] = useState<Tab>('login')
  const [signupEmail, setSignupEmail] = useState('')
  const [verifyCode, setVerifyCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [emailVerified, setEmailVerified] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [showSignupPw, setShowSignupPw] = useState(false)
  const [showSignupConfirmPw, setShowSignupConfirmPw] = useState(false)
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{
    loginEmail?: string
    loginPassword?: string
    signupEmail?: string
    signupNickname?: string
  }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [isVerifyingCode, setIsVerifyingCode] = useState(false)
  const [nicknameChecked, setNicknameChecked] = useState(false)
  const [isCheckingNickname, setIsCheckingNickname] = useState(false)
  const [signupFailReason, setSignupFailReason] = useState<string | null>(null)
  const [signupSuccessOpen, setSignupSuccessOpen] = useState(false)
  const [loginFailReason, setLoginFailReason] = useState<string | null>(null)

  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [signupForm, setSignupForm] = useState({ nickname: '', password: '', confirmPassword: '' })

  useEffect(() => {
    if (searchParams.get('error') === 'oauth') {
      setLoginFailReason('소셜 로그인에 실패했습니다. 다시 시도해 주세요.')
      setSearchParams({}, { replace: true })
    }
  }, [])

  const resetSignup = () => {
    setSignupEmail('')
    setVerifyCode('')
    setCodeSent(false)
    setEmailVerified(false)
    setSignupForm({ nickname: '', password: '', confirmPassword: '' })
    setNicknameChecked(false)
    setMessage('')
    setFieldErrors({})
  }

  const handleLogin = async () => {
    if (isSubmitting) return
    setMessage('')
    setFieldErrors({})
    setIsSubmitting(true)
    try {
      const res = await authApi.login({ email: loginForm.email, password: loginForm.password })
      const { accessToken, userId, email, nickname, role } = res.data.data
      setAuth({ id: userId, email: email ?? loginForm.email, nickname, role: role ?? 'USER' }, accessToken)
      navigate('/')
    } catch (e: any) {
      const code = e.response?.data?.code
      const msg = e.response?.data?.message ?? '로그인에 실패했습니다.'
      if (code === 'A014') {
        setFieldErrors({ loginEmail: msg })
      } else if (code === 'A002') {
        setFieldErrors({ loginPassword: msg })
      }
      setLoginFailReason(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSendCode = async () => {
    if (isSendingCode) return
    if (!signupEmail) {
      setIsSuccess(false)
      setMessage('이메일을 입력해주세요.')
      return
    }
    setMessage('')
    setIsSendingCode(true)
    try {
      await authApi.sendEmailCode(signupEmail)
      setCodeSent(true)
      setEmailVerified(false)
      setVerifyCode('')
      setIsSuccess(true)
      setMessage(`${signupEmail}로 인증 코드를 보냈어요.`)
    } catch (e: any) {
      setIsSuccess(false)
      setMessage(e.response?.data?.message ?? '인증 코드 발송에 실패했습니다.')
    } finally {
      setIsSendingCode(false)
    }
  }

  const handleVerifyCode = async () => {
    if (isVerifyingCode) return
    setMessage('')
    setIsVerifyingCode(true)
    try {
      await authApi.verifyEmailCode(signupEmail, verifyCode)
      setEmailVerified(true)
    } catch (e: any) {
      setIsSuccess(false)
      setMessage(e.response?.data?.message ?? '인증 코드가 올바르지 않습니다.')
    } finally {
      setIsVerifyingCode(false)
    }
  }

  const handleCheckNickname = async () => {
    if (isCheckingNickname) return
    if (!signupForm.nickname) {
      setFieldErrors(fe => ({ ...fe, signupNickname: '닉네임을 입력해주세요.' }))
      return
    }
    setFieldErrors(fe => ({ ...fe, signupNickname: undefined }))
    setIsCheckingNickname(true)
    try {
      const res = await authApi.checkNickname(signupForm.nickname)
      const available = res.data.data
      setNicknameChecked(available)
      if (!available) {
        setFieldErrors(fe => ({ ...fe, signupNickname: '이미 사용 중인 닉네임입니다.' }))
      }
    } catch (e: any) {
      setNicknameChecked(false)
      setFieldErrors(fe => ({ ...fe, signupNickname: e.response?.data?.message ?? '중복확인에 실패했습니다.' }))
    } finally {
      setIsCheckingNickname(false)
    }
  }

  const handleSignup = async () => {
    if (isSubmitting) return
    setMessage('')
    setFieldErrors({})
    if (!emailVerified) {
      setSignupFailReason('이메일 인증을 먼저 완료해주세요.')
      return
    }
    if (!nicknameChecked) {
      setSignupFailReason('닉네임 중복확인을 먼저 해주세요.')
      return
    }
    if (signupForm.password !== signupForm.confirmPassword) {
      setSignupFailReason('비밀번호가 일치하지 않습니다.')
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
      setSignupSuccessOpen(true)
    } catch (e: any) {
      const code = e.response?.data?.code
      const msg = e.response?.data?.message ?? '회원가입에 실패했습니다.'
      if (code === 'A005') {
        setFieldErrors({ signupEmail: msg })
      } else if (code === 'A007') {
        setFieldErrors({ signupNickname: msg })
      }
      setSignupFailReason(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

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
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <label style={{ fontFamily: 'Geist, monospace', fontSize: 12, fontWeight: 600 }}>이메일</label>
                {fieldErrors.loginEmail && (
                  <span style={{ fontFamily: 'Geist, monospace', fontSize: 11, color: '#ba1a1a' }}>{fieldErrors.loginEmail}</span>
                )}
              </div>
              <div className="window-inset" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#5a4136' }}>mail</span>
                <input
                  type="email"
                  name="loginEmail"
                  autoComplete="username"
                  placeholder="example@email.com"
                  value={loginForm.email}
                  onChange={e => { setLoginForm(f => ({ ...f, email: e.target.value })); setFieldErrors(fe => ({ ...fe, loginEmail: undefined })) }}
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'Be Vietnam Pro', fontSize: 14 }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <label style={{ fontFamily: 'Geist, monospace', fontSize: 12, fontWeight: 600 }}>비밀번호</label>
                {fieldErrors.loginPassword && (
                  <span style={{ fontFamily: 'Geist, monospace', fontSize: 11, color: '#ba1a1a' }}>{fieldErrors.loginPassword}</span>
                )}
              </div>
              <div className="window-inset" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#5a4136' }}>lock</span>
                <input
                  type={showPw ? 'text' : 'password'}
                  name="loginPassword"
                  autoComplete="current-password"
                  placeholder="비밀번호 입력"
                  value={loginForm.password}
                  onChange={e => { setLoginForm(f => ({ ...f, password: e.target.value })); setFieldErrors(fe => ({ ...fe, loginPassword: undefined })) }}
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

        {/* ── Signup Form (one-page) ── */}
        {tab === 'signup' && (
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* 이메일 + 인증번호 발송 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <label style={{ fontFamily: 'Geist, monospace', fontSize: 12, fontWeight: 600 }}>이메일</label>
                {emailVerified && (
                  <span style={{ fontFamily: 'Geist, monospace', fontSize: 11, fontWeight: 600, color: '#0c6780' }}>
                    이메일 인증 완료!
                  </span>
                )}
                {fieldErrors.signupEmail && (
                  <span style={{ fontFamily: 'Geist, monospace', fontSize: 11, color: '#ba1a1a' }}>{fieldErrors.signupEmail}</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <div className="window-inset" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#5a4136' }}>
                    {emailVerified ? 'verified' : 'mail'}
                  </span>
                  <input
                    type="email"
                    name="signupEmail"
                    autoComplete="email"
                    placeholder="이메일 주소"
                    value={signupEmail}
                    onChange={e => { setSignupEmail(e.target.value); setCodeSent(false); setEmailVerified(false); setFieldErrors(fe => ({ ...fe, signupEmail: undefined })) }}
                    disabled={emailVerified}
                    onKeyDown={e => e.key === 'Enter' && !emailVerified && handleSendCode()}
                    style={{
                      flex: 1, background: 'transparent', border: 'none', outline: 'none',
                      fontFamily: 'Be Vietnam Pro', fontSize: 14,
                      color: emailVerified ? '#0c6780' : undefined,
                    }}
                  />
                </div>
                {!emailVerified && (
                  <button
                    className="retro-btn retro-btn-primary"
                    onClick={handleSendCode}
                    disabled={isSendingCode}
                    style={{ whiteSpace: 'nowrap', padding: '0 10px', fontSize: 11 }}
                  >
                    {isSendingCode ? '발송 중...' : codeSent ? '재전송' : '인증번호 발송'}
                  </button>
                )}
              </div>
            </div>

            {/* 인증 코드 입력 — 코드 발송 후 표시 */}
            {codeSent && !emailVerified && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontFamily: 'Geist, monospace', fontSize: 12, fontWeight: 600 }}>인증 코드</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <div className="window-inset" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#5a4136' }}>pin</span>
                    <input
                      type="text"
                      name="verifyCode"
                      autoComplete="one-time-code"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="6자리 숫자"
                      value={verifyCode}
                      onChange={e => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      onKeyDown={e => e.key === 'Enter' && verifyCode.length === 6 && handleVerifyCode()}
                      style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'Be Vietnam Pro', fontSize: 14, letterSpacing: 4 }}
                    />
                  </div>
                  <button
                    className="retro-btn retro-btn-primary"
                    onClick={handleVerifyCode}
                    disabled={isVerifyingCode || verifyCode.length !== 6}
                    style={{ whiteSpace: 'nowrap', padding: '0 10px', fontSize: 11 }}
                  >
                    {isVerifyingCode ? '확인 중...' : '인증 확인'}
                  </button>
                </div>
              </div>
            )}

            {/* 닉네임 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <label style={{ fontFamily: 'Geist, monospace', fontSize: 12, fontWeight: 600 }}>닉네임</label>
                {nicknameChecked && (
                  <span style={{ fontFamily: 'Geist, monospace', fontSize: 11, fontWeight: 600, color: '#0c6780' }}>
                    사용 가능한 닉네임입니다!
                  </span>
                )}
                {fieldErrors.signupNickname && (
                  <span style={{ fontFamily: 'Geist, monospace', fontSize: 11, color: '#ba1a1a' }}>{fieldErrors.signupNickname}</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <div className="window-inset" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#5a4136' }}>
                    {nicknameChecked ? 'verified' : 'badge'}
                  </span>
                  <input
                    type="text"
                    name="nickname"
                    autoComplete="off"
                    placeholder="사용할 닉네임 (2~20자)"
                    value={signupForm.nickname}
                    onChange={e => { setSignupForm(f => ({ ...f, nickname: e.target.value })); setFieldErrors(fe => ({ ...fe, signupNickname: undefined })); setNicknameChecked(false) }}
                    onKeyDown={e => e.key === 'Enter' && handleCheckNickname()}
                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'Be Vietnam Pro', fontSize: 14 }}
                  />
                </div>
                <button
                  className="retro-btn retro-btn-primary"
                  onClick={handleCheckNickname}
                  disabled={isCheckingNickname}
                  style={{ whiteSpace: 'nowrap', padding: '0 10px', fontSize: 11 }}
                >
                  {isCheckingNickname ? '확인 중...' : '중복확인'}
                </button>
              </div>
            </div>

            {/* 비밀번호 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontFamily: 'Geist, monospace', fontSize: 12, fontWeight: 600 }}>비밀번호</label>
              <div className="window-inset" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#5a4136' }}>lock</span>
                <input
                  type={showSignupPw ? 'text' : 'password'}
                  name="newPassword"
                  autoComplete="new-password"
                  placeholder="영문+숫자 포함 8~20자"
                  value={signupForm.password}
                  onChange={e => setSignupForm(f => ({ ...f, password: e.target.value }))}
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'Be Vietnam Pro', fontSize: 14 }}
                />
                <button onClick={() => setShowSignupPw(v => !v)} type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#5a4136' }}>
                    {showSignupPw ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* 비밀번호 확인 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontFamily: 'Geist, monospace', fontSize: 12, fontWeight: 600 }}>비밀번호 확인</label>
              <div className="window-inset" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#5a4136' }}>lock_reset</span>
                <input
                  type={showSignupConfirmPw ? 'text' : 'password'}
                  name="confirmPassword"
                  autoComplete="new-password"
                  placeholder="비밀번호 재입력"
                  value={signupForm.confirmPassword}
                  onChange={e => setSignupForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'Be Vietnam Pro', fontSize: 14 }}
                />
                <button onClick={() => setShowSignupConfirmPw(v => !v)} type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#5a4136' }}>
                    {showSignupConfirmPw ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <button
              className="retro-btn retro-btn-primary"
              onClick={handleSignup}
              disabled={isSubmitting || !emailVerified || !nicknameChecked}
              style={{ width: '100%', padding: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person_add</span>
              {isSubmitting ? '처리 중...' : '회원가입'}
            </button>
          </div>
        )}
      </div>

      {/* 회원가입 실패 모달 */}
      {signupFailReason && (
        <div className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center">
          <div className="window-frame w-72">
            <div className="retro-title-bar" style={{ background: '#ba1a1a', color: '#fff' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>error</span>
              <span>회원가입 실패</span>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontFamily: 'Geist, monospace', fontSize: 13, fontWeight: 700, color: '#ba1a1a', margin: 0 }}>
                회원가입에 실패했습니다.
              </p>
              <p style={{ fontFamily: 'Be Vietnam Pro', fontSize: 13, color: '#5a4136', margin: 0 }}>
                {signupFailReason}
              </p>
              <button
                className="retro-btn retro-btn-primary"
                onClick={() => setSignupFailReason(null)}
                style={{ width: '100%', padding: '8px 0' }}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 로그인 실패 모달 */}
      {loginFailReason && (
        <div className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center">
          <div className="window-frame w-72">
            <div className="retro-title-bar" style={{ background: '#ba1a1a', color: '#fff' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>error</span>
              <span>로그인 실패</span>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontFamily: 'Geist, monospace', fontSize: 13, fontWeight: 700, color: '#ba1a1a', margin: 0 }}>
                로그인에 실패했습니다.
              </p>
              <p style={{ fontFamily: 'Be Vietnam Pro', fontSize: 13, color: '#5a4136', margin: 0 }}>
                {loginFailReason}
              </p>
              <button
                className="retro-btn retro-btn-primary"
                onClick={() => setLoginFailReason(null)}
                style={{ width: '100%', padding: '8px 0' }}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 회원가입 완료 모달 */}
      {signupSuccessOpen && (
        <div className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center">
          <div className="window-frame w-72">
            <div className="retro-title-bar" style={{ background: '#0c6780', color: '#fff' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>check_circle</span>
              <span>회원가입 완료</span>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontFamily: 'Geist, monospace', fontSize: 13, fontWeight: 700, color: '#0c6780', margin: 0 }}>
                회원가입이 완료됐어요!
              </p>
              <p style={{ fontFamily: 'Be Vietnam Pro', fontSize: 13, color: '#5a4136', margin: 0 }}>
                이제 로그인해서 CWWW를 시작해보세요.
              </p>
              <button
                className="retro-btn retro-btn-primary"
                onClick={() => setSignupSuccessOpen(false)}
                style={{ width: '100%', padding: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>login</span>
                로그인하러가기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
