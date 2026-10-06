/** "6/10/2026" from an ISO date or a Date (same format on every server, no locale data needed) */
export function formatDate(value: string | Date) {
  const d = typeof value === 'string' ? new Date(value) : value
  return `${d.getUTCDate()}/${d.getUTCMonth() + 1}/${d.getUTCFullYear()}`
}

/** The first `max` characters of a text on one line, with … when cut */
export function snippet(text: string, max = 120) {
  const flat = text.replace(/\s+/g, ' ').trim()
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat
}

/** 2.4 MB, 350 KB */
export function fileSize(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
}
