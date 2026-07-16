export function formatNotificationTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
}

export function formatNotificationActorName(actorName: string): string {
  return actorName.replace(/^\s*·\s*/, '')
}
