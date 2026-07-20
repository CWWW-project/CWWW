import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { authApi } from '../../api/auth'

type Step = 'request' | 'reset'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [step, setStep] = useState<Step>('request')
  const [email, setEmail] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [resetSuccessOpen, setResetSuccessOpen] = useState(false)

  useEffect(() => {
    const token = searchParams.get('token')
    if (token) {
      setResetToken(token)
      setStep('reset')
    }
  }, [searchParams])

  const handleRequest = async () => {
    if (isSubmitting) return
    setMessage('')
    setIsSubmitting(true)
    try {
      await authApi.forgotPassword(email)
      setIsSuccess(true)
      setMessage('인증번호를 이메일로 보냈어요. 30분 이내에 입력해주세요.')
      setStep('reset')
    } catch (e: any) {
      setIsSuccess(false)
      setMessage(e.response?.data?.message ?? '이메일 발송에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = async () => {
    if (isSubmitting) return
    setMessage('')
    if (newPassword !== confirmPassword) {
      setIsSuccess(false)
      setMessage('비밀번호가 일치하지 않습니다.')
      return
    }
    setIsSubmitting(true)
    try {
      await authApi.resetPassword(resetToken, newPassword)
      setResetSuccessOpen(true)
    } catch (e: any) {
      setIsSuccess(false)
      setMessage(e.response?.data?.message ?? '비밀번호 재설정에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 gap-6">
      <div className="text-center">
        <h1 style={{ fontFamily: 'Bricolage Grotesque', fontSize: 36, fontWeight: 800, color: '#7c2e00', letterSpacing: -1 }}>
          싸이월드
        </h1>
        <p style={{ fontFamily: 'Be Vietnam Pro', fontSize: 14, color: '#360f00', marginTop: 4 }}>
          비밀번호를 재설정해요
        </p>
      </div>

      <div className="window-frame w-full max-w-sm">
        <div className="retro-title-bar">
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>lock_reset</span>
          <span>비밀번호 찾기</span>
        </div>

        {message && (
          <p style={{ margin: '8px 16px 0', fontFamily: 'Geist, monospace', fontSize: 12, color: isSuccess ? '#0c6780' : '#ba1a1a' }}>
            {message}
          </p>
        )}

        {step === 'request' && (
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontFamily: 'Geist, monospace', fontSize: 12, fontWeight: 600 }}>이메일</label>
              <div className="window-inset" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#5a4136' }}>mail</span>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="가입한 이메일 주소"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleRequest()}
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'Be Vietnam Pro', fontSize: 14 }}
                />
              </div>
            </div>
            <button
              className="retro-btn retro-btn-primary"
              onClick={handleRequest}
              disabled={isSubmitting}
              style={{ width: '100%', padding: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>send</span>
              {isSubmitting ? '전송 중...' : '인증번호 받기'}
            </button>
          </div>
        )}

        {step === 'reset' && (
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: '인증번호', icon: 'key', type: 'text', name: 'resetCode', autoComplete: 'one-time-code', placeholder: '이메일로 받은 인증번호', value: resetToken, onChange: setResetToken },
              { label: '새 비밀번호', icon: 'lock', type: 'password', name: 'newPassword', autoComplete: 'new-password', placeholder: '영문+숫자 포함 8~20자', value: newPassword, onChange: setNewPassword, show: showNewPw, toggleShow: () => setShowNewPw(v => !v) },
              { label: '새 비밀번호 확인', icon: 'lock_reset', type: 'password', name: 'confirmNewPassword', autoComplete: 'new-password', placeholder: '비밀번호 재입력', value: confirmPassword, onChange: setConfirmPassword, show: showConfirmPw, toggleShow: () => setShowConfirmPw(v => !v) },
            ].map(({ label, icon, type, name, autoComplete, placeholder, value, onChange, show, toggleShow }) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontFamily: 'Geist, monospace', fontSize: 12, fontWeight: 600 }}>{label}</label>
                <div className="window-inset" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#5a4136' }}>{icon}</span>
                  <input
                    type={type === 'password' && show ? 'text' : type}
                    name={name}
                    autoComplete={autoComplete}
                    placeholder={placeholder}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'Be Vietnam Pro', fontSize: 14 }}
                  />
                  {type === 'password' && (
                    <button onClick={toggleShow} type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#5a4136' }}>
                        {show ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button
              className="retro-btn retro-btn-primary"
              onClick={handleReset}
              disabled={isSubmitting}
              style={{ width: '100%', padding: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check_circle</span>
              {isSubmitting ? '변경 중...' : '비밀번호 변경'}
            </button>
            <button
              onClick={handleRequest}
              disabled={isSubmitting}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Geist, monospace', fontSize: 12, color: '#5a4136', textDecoration: 'underline' }}
            >
              인증번호 다시 받기
            </button>
          </div>
        )}

        <div style={{ padding: '0 16px 16px' }}>
          <Link
            to="/auth/login"
            style={{ fontFamily: 'Geist, monospace', fontSize: 12, color: '#5a4136', textDecoration: 'underline' }}
          >
            로그인으로 돌아가기
          </Link>
        </div>
      </div>

      {resetSuccessOpen && (
        <div className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center">
          <div className="window-frame w-72">
            <div className="retro-title-bar" style={{ background: '#0c6780', color: '#fff' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>check_circle</span>
              <span>비밀번호 재설정 완료</span>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontFamily: 'Geist, monospace', fontSize: 13, fontWeight: 700, color: '#0c6780', margin: 0 }}>
                비밀번호가 재설정되었어요!
              </p>
              <p style={{ fontFamily: 'Be Vietnam Pro', fontSize: 13, color: '#5a4136', margin: 0 }}>
                새 비밀번호로 로그인해주세요.
              </p>
              <button
                className="retro-btn retro-btn-primary"
                onClick={() => navigate('/auth/login')}
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
