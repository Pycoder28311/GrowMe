import type { Author } from '@growme/shared'

/** Load the author with a row: `with: { user: authorColumns }` (only public fields, never the email) */
export const authorColumns = { columns: { id: true, name: true, image: true } } as const

export const toAuthor = (user: { id: string; name: string; image: string | null }): Author => ({
  id: user.id,
  name: user.name,
  image: user.image,
})
