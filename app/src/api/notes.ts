import { File as ExpoFile } from 'expo-file-system';
import type { ImagePickerAsset } from 'expo-image-picker';

const API_URL = `${process.env.EXPO_PUBLIC_API_URL}/api`;

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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const isJson = typeof init?.body === 'string';
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: isJson ? { 'Content-Type': 'application/json', ...init?.headers } : init?.headers,
  });
  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

/** Uploads all picked images in a single request */
function uploadImages(assets: ImagePickerAsset[]) {
  const form = new FormData();
  for (const asset of assets) {
    // Web gives a browser File; native wraps the local file (expo/fetch needs a Blob, not a uri)
    form.append('files', asset.file ?? new ExpoFile(asset.uri));
  }
  return request<NoteImage[]>('/images', { method: 'POST', body: form });
}

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
  list: () => request<Note[]>('/notes'),
  save,
  remove: (id: number) => request<void>(`/notes/${id}`, { method: 'DELETE' }),
};
