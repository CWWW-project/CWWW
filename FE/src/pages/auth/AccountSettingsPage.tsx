import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../../api/auth'
import { userApi } from '../../api/user'
import { useAuthStore } from '../../store/authStore'
import { useMinihompyStore } from '../../store/minihompyStore'

export default function AccountSettingsPage() {
  const navigate = useNavigate()
  const { user, clearAuth } = useAuthStore()
  const { clearMain } = useMinihompyStore()

  useEffect(() => {
    if (!user) navigate('/auth/login')
  }, [user, navigate])

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwMessage, setPwMessage] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwSubmitting, setPwSubmitting] = useState(false)

  const [withdrawPassword, setWithdrawPassword] = useState('')
  const [withdrawConfirmOpen, setWithdrawConfirmOpen] = useState(false)
  const [withdrawMessage, setWithdrawMessage] = useState('')
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false)

  const handleChangePassword = async () => {
    if (pwSubmitting) return
    setPwMessage('')
    if (newPassword !== confirmPassword) {
      setPwSuccess(false)
      setPwMessage('새 비밀번호가 일치하지 않습니다.')
      return
    }
    setPwSubmitting(true)
    try {
      await authApi.changePassword(currentPassword, newPassword)
      setPwSuccess(true)
      setPwMessage('비밀번호가 변경되었어요.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (e: any) {
      setPwSuccess(false)
      setPwMessage(e.response?.data?.message ?? '비밀번호 변경에 실패했습니다.')
    } finally {
      setPwSubmitting(false)
    }
  }

  const [logoutSubmitting, setLogoutSubmitting] = useState(false)

  const handleLogout = async () => {
    if (logoutSubmitting) return
    setLogoutSubmitting(true)
    try {
      await authApi.logout()
    } catch {
      // 서버 호출 실패해도 로컬 로그아웃은 진행
    } finally {
      clearAuth()
      clearMain()
      navigate('/auth/login')
    }
  }

  const handleWithdraw = async () => {
    if (withdrawSubmitting) return
    setWithdrawMessage('')
    setWithdrawSubmitting(true)
    try {
      await userApi.withdraw(withdrawPassword)
      clearAuth()
      navigate('/auth/login')
    } catch (e: any) {
      setWithdrawMessage(e.response?.data?.message ?? '회원 탈퇴에 실패했습니다.')
    } finally {
      setWithdrawSubmitting(false)
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen flex flex-col items-center py-12 gap-6">
      <div className="text-center">
        <h1 style={{ fontFamily: 'Bricolage Grotesque', fontSize: 28, fontWeight: 800, color: '#7c2e00', letterSpacing: -1 }}>
          계정 설정
        </h1>
        <p style={{ fontFamily: 'Be Vietnam Pro', fontSize: 13, color: '#360f00', marginTop: 4 }}>
          {user.nickname}님의 계정 관리
        </p>
      </div>

      {/* 로그아웃 */}
      <button
        className="retro-btn w-full max-w-sm"
        onClick={handleLogout}
        disabled={logoutSubmitting}
        style={{ padding: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>logout</span>
        {logoutSubmitting ? '로그아웃 중...' : '로그아웃'}
      </button>

      {/* 비밀번호 변경 */}
      <div className="window-frame w-full max-w-sm">
        <div className="retro-title-bar">
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>lock</span>
          <span>비밀번호 변경</span>
        </div>

        {pwMessage && (
          <p style={{ margin: '8px 16px 0', fontFamily: 'Geist, monospace', fontSize: 12, color: pwSuccess ? '#0c6780' : '#ba1a1a' }}>
            {pwMessage}
          </p>
        )}

        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { label: '현재 비밀번호', placeholder: '현재 비밀번호', value: currentPassword, onChange: setCurrentPassword },
            { label: '새 비밀번호', placeholder: '영문+숫자 포함 8~20자', value: newPassword, onChange: setNewPassword },
            { label: '새 비밀번호 확인', placeholder: '비밀번호 재입력', value: confirmPassword, onChange: setConfirmPassword },
          ].map(({ label, placeholder, value, onChange }) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontFamily: 'Geist, monospace', fontSize: 12, fontWeight: 600 }}>{label}</label>
              <div className="window-inset" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#5a4136' }}>lock</span>
                <input
                  type="password"
                  placeholder={placeholder}
                  value={value}
                  onChange={e => onChange(e.target.value)}
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'Be Vietnam Pro', fontSize: 14 }}
                />
              </div>
            </div>
          ))}
          <button
            className="retro-btn retro-btn-primary"
            onClick={handleChangePassword}
            disabled={pwSubmitting}
            style={{ width: '100%', padding: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check_circle</span>
            {pwSubmitting ? '변경 중...' : '비밀번호 변경'}
          </button>
        </div>
      </div>

      {/* 회원 탈퇴 */}
      <div className="window-frame w-full max-w-sm">
        <div className="retro-title-bar" style={{ background: '#ba1a1a' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>person_remove</span>
          <span>회원 탈퇴</span>
        </div>

        {withdrawMessage && (
          <p style={{ margin: '8px 16px 0', fontFamily: 'Geist, monospace', fontSize: 12, color: '#ba1a1a' }}>
            {withdrawMessage}
          </p>
        )}

        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontFamily: 'Be Vietnam Pro', fontSize: 12, color: '#ba1a1a' }}>
            탈퇴하면 계정 정보가 삭제되고 되돌릴 수 없어요.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontFamily: 'Geist, monospace', fontSize: 12, fontWeight: 600 }}>비밀번호 확인</label>
            <div className="window-inset" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#5a4136' }}>lock</span>
              <input
                type="password"
                placeholder="현재 비밀번호"
                value={withdrawPassword}
                onChange={e => setWithdrawPassword(e.target.value)}
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'Be Vietnam Pro', fontSize: 14 }}
              />
            </div>
          </div>

          {!withdrawConfirmOpen ? (
            <button
              className="retro-btn"
              onClick={() => setWithdrawConfirmOpen(true)}
              disabled={!withdrawPassword || withdrawSubmitting}
              style={{ width: '100%', padding: '8px 0', background: '#ba1a1a', borderColor: '#ba1a1a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person_remove</span>
              회원 탈퇴
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ fontFamily: 'Geist, monospace', fontSize: 12, fontWeight: 700, color: '#ba1a1a', textAlign: 'center' }}>
                정말 탈퇴하시겠어요? 이 작업은 되돌릴 수 없어요.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="retro-btn"
                  onClick={() => setWithdrawConfirmOpen(false)}
                  disabled={withdrawSubmitting}
                  style={{ flex: 1, padding: '8px 0' }}
                >
                  취소
                </button>
                <button
                  className="retro-btn"
                  onClick={handleWithdraw}
                  disabled={withdrawSubmitting}
                  style={{ flex: 1, padding: '8px 0', background: '#ba1a1a', borderColor: '#ba1a1a', color: '#fff' }}
                >
                  {withdrawSubmitting ? '처리 중...' : '탈퇴 확정'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
