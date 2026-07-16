import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { userApi, type UserMeResult } from '../../api/user'
import { authApi } from '../../api/auth'
import { useAuthStore } from '../../store/authStore'

export default function SettingsPage() {
  const navigate = useNavigate()
  const { clearAuth, setUser } = useAuthStore()

  const [me, setMe] = useState<UserMeResult | null>(null)
  const [nickname, setNickname] = useState('')
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) {
      navigate('/auth/login', { replace: true })
      return
    }
    userApi.getMe()
      .then(res => {
        setMe(res.data.data)
        setNickname(res.data.data.nickname)
      })
      .catch(() => navigate('/auth/login', { replace: true }))
  }, [])

  const handleUpdateNickname = async () => {
    if (isSubmitting) return
    setMessage('')
    setIsSubmitting(true)
    try {
      const res = await userApi.updateMe(nickname.trim())
      const updated = res.data.data
      setMe(updated)
      setUser({ id: updated.userId, email: updated.email ?? '', nickname: updated.nickname })
      setIsSuccess(true)
      setMessage('닉네임이 변경되었습니다.')
    } catch (e: any) {
      setIsSuccess(false)
      setMessage(e.response?.data?.message ?? '변경에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogout = async () => {
    try { await authApi.logout() } catch { /* ignore */ }
    clearAuth()
    navigate('/auth/login')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 gap-6 px-4">
      {/* 로고 */}
      <div className="text-center">
        <h1 style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 28, fontWeight: 700, color: 'var(--c-navy)', letterSpacing: -1 }}>
          싸이<span style={{ color: 'var(--c-mid)' }}>월드</span>
        </h1>
      </div>

      {/* Settings Card */}
      <div className="c-card w-full" style={{ maxWidth: 360 }}>
        {/* Header */}
        <div className="c-card-header">
          <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--c-light)' }}>settings</span>
          설정
          <button
            onClick={() => navigate(-1)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#a8ccee', display: 'flex', alignItems: 'center' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
          </button>
        </div>

        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, background: '#fff' }}>

          {/* 내 정보 */}
          {me && (
            <div style={{ background: '#f8fafc', border: '1.5px solid var(--c-card-border)', borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-navy)', fontFamily: 'IBM Plex Mono' }}>내 정보</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--c-mid)' }}>account_circle</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-navy)' }}>{me.nickname}</span>
              </div>
              {me.email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--c-sub)' }}>mail</span>
                  <span style={{ fontSize: 13, color: 'var(--c-sub)' }}>{me.email}</span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--c-sub)' }}>login</span>
                <span style={{ fontSize: 13, color: 'var(--c-sub)' }}>
                  {me.provider ? `${me.provider} 로그인` : '이메일 로그인'}
                </span>
              </div>
            </div>
          )}

          {/* 닉네임 수정 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-navy)' }}>닉네임 변경</label>
            <div className="flex items-center gap-2 c-input" style={{ padding: '8px 12px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--c-sub)' }}>badge</span>
              <input
                type="text"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleUpdateNickname()}
                maxLength={20}
                placeholder="새 닉네임 (2~20자)"
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'Noto Sans KR', fontSize: 14, color: 'var(--c-text)' }}
              />
            </div>
          </div>

          {message && (
            <p style={{ fontSize: 12, color: isSuccess ? 'var(--c-mid)' : '#dc2626', fontFamily: 'Noto Sans KR' }}>
              {message}
            </p>
          )}

          <button
            className="c-sb-btn c-sb-btn--primary"
            onClick={handleUpdateNickname}
            disabled={isSubmitting || nickname.trim().length < 2}
            style={{ borderRadius: 20, padding: '10px 0', fontSize: 13 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check</span>
            {isSubmitting ? '저장 중...' : '닉네임 저장'}
          </button>

          <div style={{ borderTop: '1px solid var(--c-card-border)' }} />

          <button
            className="c-sb-btn c-sb-btn--outline"
            onClick={() => navigate('/')}
            style={{ borderRadius: 20, padding: '8px 0', fontSize: 13 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>home</span>
            홈으로 돌아가기
          </button>

          <button
            className="c-sb-btn c-sb-btn--danger"
            onClick={handleLogout}
            style={{ borderRadius: 20, padding: '8px 0', fontSize: 13 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>logout</span>
            로그아웃
          </button>
        </div>
      </div>
    </div>
  )
}
