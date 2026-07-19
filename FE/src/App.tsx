import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'

import { GlobalNotificationLayer } from './app/GlobalNotificationLayer'
import LoginPage from './pages/auth/LoginPage'
import SignupPage from './pages/auth/SignupPage'
import FeedPage from './pages/post/FeedPage'
import ChatPage from './pages/chat/ChatPage'
import ShopPage from './pages/pay/ShopPage'
import MiniroomPage from './pages/room/MiniroomPage'
import MinihompyPage from './pages/home/MinihompyPage'
import FriendsPage from './pages/friend/FriendsPage'
import { useAuthStore } from './store/authStore'
import OAuthCallbackPage from './pages/auth/OAuthCallbackPage'
import GuestbookPage from './pages/guestbook/GuestbookPage'
import { getAudioElement } from './store/audioPlayer'
import { useMinihompyStore } from './store/minihompyStore'
import { useEffect } from 'react'

const MOBILE_TABS = [
  { icon: 'home', label: '홈', path: '/' },
  { icon: 'edit_note', label: '다이어리', pathFn: (userId?: number) => `/home/${userId ?? 'me'}` },
  { icon: 'forum', label: '채팅', path: '/chat' },
  { icon: 'storefront', label: '상점', path: '/shop' },
  { icon: 'person', label: '내 홈피', pathFn: (userId?: number) => `/home/${userId ?? 'me'}` },
]

function useGlobalBgm() {
  const main = useMinihompyStore(state => state.main)

  useEffect(() => {
    if (!main?.bgmUrl) return
    const audio = getAudioElement()
    if (audio.src === main.bgmUrl) return   // 이미 같은 곡이면 아무것도 안 함
    audio.src = main.bgmUrl
    audio.play().catch(() => {})
  }, [main?.bgmUrl])
}

function App() {
  useGlobalBgm()
  return (
    <BrowserRouter>
      <GlobalNotificationLayer />
      <GlobalMobileNav />
      <Routes>
        {/* AUTH - 윤주원 */}
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/signup" element={<SignupPage />} />
        <Route path="/oauth/callback" element={<OAuthCallbackPage />} />

        {/* POST - 송경용 */}
        <Route path="/" element={<FeedPage />} />
        <Route path="/friends" element={<FriendsPage />} />

        {/* HOME - 김채린, 특정 유저(다른 사람) 미니홈피 가기 */}
        <Route path="/home/:userId" element={<MinihompyPage />} />
        {/* GUESTBOOk - 김채린 */}
        <Route path="/guestbook/:userId" element={<GuestbookPage />} />

        {/* CHAT - 김찬호 */}
        <Route path="/chat" element={<ChatPage />} />

        {/* PAY - 장수호 */}
        <Route path="/shop" element={<ShopPage />} />

        {/* ROOM - 정용혁 */}
        <Route path="/room" element={<MiniroomPage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
