import { z } from 'zod'

/** What a client may send: text + ordered image ids (userId always comes from the session) */
export const noteInput = z.object({
  text: z.string().trim().min(1).max(1000),
  imageIds: z.array(z.number().int().positive()).max(10).default([]),
})

export type NoteInput = z.infer<typeof noteInput>
