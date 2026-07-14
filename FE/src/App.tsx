import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import LoginPage from './pages/auth/LoginPage'
import SignupPage from './pages/auth/SignupPage'
import FeedPage from './pages/post/FeedPage'
import ChatPage from './pages/chat/ChatPage'
import ShopPage from './pages/pay/ShopPage'
import MiniroomPage from './pages/room/MiniroomPage'
import MinihompyPage from './pages/home/MinihompyPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* AUTH - 윤주원 */}
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/signup" element={<SignupPage />} />

        {/* HOME - 김채린 */}
        <Route path="/" element={<MinihompyPage />} />
        <Route path="/home/:userId" element={<MinihompyPage />} />

        {/* POST - 송경용 */}
        <Route path="/feed" element={<FeedPage />} />

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
