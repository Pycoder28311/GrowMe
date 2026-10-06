import type { Page } from '@growme/shared';
import type { ImagePickerAsset } from 'expo-image-picker';
import { request } from './client';
import { uploadImages } from './images';

export type NoteImage = {
  id: number;
  url: string;
};

export type Note = {
  id: number;
  text: string;
  images: NoteImage[];
};

/** An image in the editor: already uploaded (has id) or newly picked (has asset) */
export type DraftImage = {
  url: string;
  id?: number;
  asset?: ImagePickerAsset;
};

/** Creates or updates a note: at most one upload request + one note request */
async function save(noteId: number | null, text: string, drafts: DraftImage[]) {
  const newAssets = drafts.flatMap((d) => (d.asset ? [d.asset] : []));
  const uploaded = newAssets.length ? await uploadImages(newAssets) : [];

  let next = 0;
  const imageIds = drafts.map((d) => d.id ?? uploaded[next++].id);
  const body = JSON.stringify({ text, imageIds });

  return noteId === null
    ? request<Note>('/notes', { method: 'POST', body })
    : request<Note>(`/notes/${noteId}`, { method: 'PATCH', body });
}

export const notesApi = {
  /** 20 notes per call; pass the previous page's nextCursor to get the next 20 */
  list: (cursor?: string | null) =>
    request<Page<Note>>(`/notes?limit=20${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`),
  save,
  remove: (id: number) => request<void>(`/notes/${id}`, { method: 'DELETE' }),
};
