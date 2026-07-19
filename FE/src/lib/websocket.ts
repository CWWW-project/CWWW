export function getWebSocketUrl(): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//localhost:8080/ws`
}

export function buildFrame(command: string, headers: Record<string, string>, body = ''): string {
  const headerLines = Object.entries(headers).map(([key, value]) => `${key}:${value}`)
  return `${command}\n${headerLines.join('\n')}\n\n${body}\0`
}

export function parseFrames(raw: string): Array<{ command: string, headers: Record<string, string>, body: string }> {
  return raw
    .split('\0')
    .map((frame) => frame.trim())
    .filter(Boolean)
    .map((frame) => {
      const [headerPart, ...bodyParts] = frame.split('\n\n')
      const [command, ...headerLines] = headerPart.split('\n')
      const headers = headerLines.reduce<Record<string, string>>((acc, line) => {
        const separatorIndex = line.indexOf(':')
        if (separatorIndex === -1) return acc
        const key = line.slice(0, separatorIndex)
        const value = line.slice(separatorIndex + 1)
        acc[key] = value
        return acc
      }, {})

      return {
        command,
        headers,
        body: bodyParts.join('\n\n'),
      }
    })
}
