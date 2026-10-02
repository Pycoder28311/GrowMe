import { relations } from 'drizzle-orm'
import { sqliteTable, integer, text, primaryKey, index } from 'drizzle-orm/sqlite-core'
import { user } from './auth-schema'
export * from './auth-schema'

export const notes = sqliteTable(
    'notes',
    {
        id: integer('id').primaryKey({ autoIncrement: true }),
        userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
        text: text('text').notNull(),
    },
    (t) => [index('notes_user_id_idx').on(t.userId)],
)

export const images = sqliteTable('images', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    key: text('key').notNull().unique(),
    contentType: text('content_type').notNull(),
    size: integer('size').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})


// Which images belong to which note, in carousel order
export const noteImages = sqliteTable(
    'note_images',
    {
        noteId: integer('note_id').notNull().references(() => notes.id, { onDelete: 'cascade' }),
        imageId: integer('image_id').notNull().references(() => images.id, { onDelete: 'cascade' }),
        position: integer('position').notNull(),
    },
    (t) => [primaryKey({ columns: [t.noteId, t.imageId] })],
)

export const notesRelations = relations(notes, ({ many }) => ({
    images: many(noteImages),
}))

export const noteImagesRelations = relations(noteImages, ({ one }) => ({
    note: one(notes, { fields: [noteImages.noteId], references: [notes.id] }),
    image: one(images, { fields: [noteImages.imageId], references: [images.id] }),
}))
