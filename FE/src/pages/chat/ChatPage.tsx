import { ChatPageView } from './ChatPageView'
import { useChatPage } from './useChatPage'

export default function ChatPage() {
  const chatPage = useChatPage()

  return <ChatPageView {...chatPage} />
}
