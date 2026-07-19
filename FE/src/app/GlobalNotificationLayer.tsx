import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

import { buildFrame, getWebSocketUrl, parseFrames } from '../lib/websocket'
import { useAuthStore } from '../store/authStore'
import type { NotificationItem, NotificationPayload } from './types'
import { formatNotificationActorName, formatNotificationTime } from './utils'

export function GlobalNotificationLayer() {
  const location = useLocation()
  const { accessToken, user } = useAuthStore()
  const userId = user?.id ?? Number(localStorage.getItem('userId') ?? 0)
  const [toastNotifications, setToastNotifications] = useState<NotificationItem[]>([])
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0)
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false)
  const socketRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    setToastNotifications([])
    setNotifications([])
    setUnreadNotificationCount(0)
    setIsNotificationPanelOpen(false)
  }, [userId])

  useEffect(() => {
    if (!accessToken || !userId) {
      socketRef.current?.close()
      socketRef.current = null
      setToastNotifications([])
      setNotifications([])
      setUnreadNotificationCount(0)
      setIsNotificationPanelOpen(false)
      return
    }

    const socket = new WebSocket(getWebSocketUrl())
    socketRef.current = socket

    socket.onopen = () => {
      socket.send(buildFrame('CONNECT', {
        'accept-version': '1.2',
        host: 'localhost',
        Authorization: `Bearer ${accessToken}`,
      }))
    }

    socket.onmessage = (event) => {
      const frames = parseFrames(String(event.data))

      frames.forEach((frame) => {
        if (frame.command === 'CONNECTED') {
          socket.send(buildFrame('SUBSCRIBE', {
            id: `global-notification-${userId}`,
            destination: `/sub/notifications/${userId}`,
          }))
          return
        }

        if (frame.command !== 'MESSAGE') return
        if (frame.headers.destination !== `/sub/notifications/${userId}`) return

        const payload = JSON.parse(frame.body) as NotificationPayload
        const notification: NotificationItem = {
          id: payload.notificationId,
          eventType: payload.eventType,
          actorId: payload.actorId,
          actorName: payload.actorName,
          targetId: payload.targetId,
          targetType: payload.targetType,
          preview: payload.preview,
          createdAt: payload.createdAt,
        }

        setNotifications((prev) => [notification, ...prev.filter((item) => item.id !== notification.id)])

        if (location.pathname === '/chat') {
          return
        }

        setUnreadNotificationCount((prev) => prev + 1)
        setToastNotifications((prev) => {
          const next = [notification, ...prev.filter((item) => item.id !== notification.id)]
          return next.slice(0, 3)
        })

        window.setTimeout(() => {
          setToastNotifications((prev) => prev.filter((item) => item.id !== notification.id))
        }, 4000)
      })
    }

    socket.onclose = () => {
      if (socketRef.current === socket) {
        socketRef.current = null
      }
    }

    return () => {
      socket.close()
      if (socketRef.current === socket) {
        socketRef.current = null
      }
    }
  }, [accessToken, userId, location.pathname])

  const dismissToastNotification = (notificationId: string) => {
    setToastNotifications((prev) => prev.filter((notification) => notification.id !== notificationId))
  }

  const toggleNotificationPanel = () => {
    setIsNotificationPanelOpen((prev) => {
      const next = !prev
      if (!prev) {
        setUnreadNotificationCount(0)
      }
      return next
    })
  }

  if (!accessToken || !userId || location.pathname.startsWith('/auth')) {
    return null
  }

  return (
    <>
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 1000 }}>
        <button
          type="button"
          onClick={toggleNotificationPanel}
          className="retro-window"
          style={{ padding: '6px 10px', background: '#fff7f4', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>notifications</span>
          {unreadNotificationCount > 0 ? (
            <span style={{ minWidth: 18, height: 18, padding: '0 4px', borderRadius: 9999, background: '#ba1a1a', color: '#fff', fontFamily: 'Geist, monospace', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {unreadNotificationCount}
            </span>
          ) : null}
        </button>
        {isNotificationPanelOpen ? (
          <div className="retro-window retro-scrollbar" style={{ position: 'absolute', top: 44, right: 0, width: 320, maxHeight: 360, overflowY: 'auto', background: '#fff7f4', padding: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {notifications.length === 0 ? (
              <div style={{ padding: 12, textAlign: 'center', fontFamily: 'Be Vietnam Pro', fontSize: 12, color: '#5a4136' }}>
                아직 받은 알림이 없습니다.
              </div>
            ) : notifications.map((notification) => (
              <div
                key={notification.id}
                className="retro-inner-box"
                style={{ padding: 10, textAlign: 'left', background: '#fff' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontFamily: 'Geist, monospace', fontSize: 11, fontWeight: 700 }}>{formatNotificationActorName(notification.actorName)}</span>
                  <span style={{ fontFamily: 'Geist, monospace', fontSize: 10, color: '#5a4136' }}>{formatNotificationTime(notification.createdAt)}</span>
                </div>
                <div style={{ fontFamily: 'Be Vietnam Pro', fontSize: 12, color: '#5a4136', wordBreak: 'break-word' }}>
                  {notification.preview}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      {toastNotifications.length > 0 ? (
        <div style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 8, width: 280 }}>
          {toastNotifications.map((notification) => (
            <button
              key={notification.id}
              onClick={() => dismissToastNotification(notification.id)}
              className="retro-window"
              style={{ padding: 10, textAlign: 'left', background: '#fff7f4', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                <span style={{ fontFamily: 'Geist, monospace', fontSize: 11, fontWeight: 700 }}>{formatNotificationActorName(notification.actorName)}</span>
                <span style={{ fontFamily: 'Geist, monospace', fontSize: 10, color: '#5a4136' }}>{formatNotificationTime(notification.createdAt)}</span>
              </div>
              <div style={{ fontFamily: 'Be Vietnam Pro', fontSize: 12, color: '#5a4136', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {notification.preview}
              </div>
            </button>
          ))}
        </div>
      ) : null}
    </>
  )
}
