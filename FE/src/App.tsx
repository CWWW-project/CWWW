import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'

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

const MOBILE_TABS = [
  { icon: 'home', label: '홈', path: '/' },
  { icon: 'edit_note', label: '다이어리', pathFn: (userId?: number) => `/home/${userId ?? 'me'}` },
  { icon: 'forum', label: '채팅', path: '/chat' },
  { icon: 'storefront', label: '상점', path: '/shop' },
  { icon: 'person', label: '내 홈피', pathFn: (userId?: number) => `/home/${userId ?? 'me'}` },
]

function GlobalMobileNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  if (location.pathname.startsWith('/auth/') || location.pathname === '/oauth/callback') return null

  const tabs = MOBILE_TABS.map(tab => ({
    ...tab,
    path: typeof tab.pathFn === 'function' ? tab.pathFn(user?.id) : tab.path,
  }))

  // 오른쪽에서 탐색해 마지막 매칭 탭 우선 (내 홈피 > 다이어리)
  const activeIndex = tabs.reduceRight<number>((found, tab, i) => {
    if (found !== -1) return found
    const match = location.pathname === tab.path || (tab.path !== '/' && location.pathname.startsWith(tab.path))
    return match ? i : -1
  }, -1)

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center bg-[#e2e2e2] px-2 border-t-2 border-[#e3bfb1] h-16">
      {tabs.map((tab, index) => {
        const active = index === activeIndex
        return (
          <button
            key={tab.label}
            onClick={() => navigate(tab.path)}
            aria-current={active ? 'page' : undefined}
            className={`flex flex-col items-center justify-center p-1 flex-1 cursor-pointer bg-transparent border-none${active ? ' bg-[#a33e00] text-white rounded-lg border-t-2 border-l-2 border-white border-r-2 border-b-2 border-[#7c2e00] mx-1' : ' text-[#5a4136]'}`}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>{tab.icon}</span>
            <span className="font-[Geist,monospace] text-[12px] font-semibold mt-1">{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

function App() {
  return (
    <BrowserRouter>
      <GlobalMobileNav />
      <Routes>
        {/* AUTH - 윤주원 */}
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/signup" element={<SignupPage />} />
        <Route path="/oauth/callback" element={<OAuthCallbackPage />} />

        {/* POST - 송경용 */}
        <Route path="/" element={<FeedPage />} />
        <Route path="/friends" element={<FriendsPage />} />

        {/* HOME - 김채린 */}
        <Route path="/home/:userId" element={<MinihompyPage />} />

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
