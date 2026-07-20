import { useLocation, useNavigate } from 'react-router-dom'

interface Props {
  owner: boolean
  ownerId: number
}

export default function MinihompyTabs({ owner, ownerId }: Props) {
  const navigate = useNavigate()
  const location = useLocation()


  const tabs = [
    {
      icon: 'home',
      label: '홈',
      path: owner ? '/' : `/home/${ownerId}`,
      public: true,
    },
    {
      icon: 'edit_note',
      label: '다이어리',
      path: `/diary/${ownerId}`,
      public: true,
    },
    {
      icon: 'forum',
      label: '방명록',
      path: `/guestbook/${owner ? 'me' : ownerId}`,
      public: true,
    },
    {
      icon: 'footprint',
      label: '방문자',
      path: `/visitor/${owner ? 'me' : ownerId}`,
      public: false,
    },
    {
      icon: 'chat',
      label: '채팅',
      path: '/chat',
      public: false,
    },
    {
      icon: 'storefront',
      label: '상점',
      path: '/shop',
      public: false,
    },
  ].filter(tab => owner || tab.public)

  const activeIndex = tabs.findIndex(tab => location.pathname === tab.path)

  return (
    <nav className="hidden md:flex flex-col gap-1 w-16 pt-12 relative -ml-[2px] z-0">
      {tabs.map((tab, index) => {
        const active = index === activeIndex

        return (
          <button
            key={tab.label}
            onClick={() => navigate(tab.path)}
            aria-current={active ? 'page' : undefined}
            className={`tab-item${
              active
                ? ' tab-active'
                : ' bg-[#f3f3f3] text-[#5a4136] hover:bg-[#e2e2e2]'
            } py-2 px-1 text-center font-[Geist,monospace] text-[12px] font-semibold flex flex-col items-center gap-1 cursor-pointer border-none`}
          >
            <span className="material-symbols-outlined text-lg">
              {tab.icon}
            </span>
            {tab.label}
          </button>
        )
      })}
    </nav>
  )
}