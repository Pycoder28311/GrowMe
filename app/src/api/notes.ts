const API_URL = `${process.env.EXPO_PUBLIC_API_URL}/api/notes`;

export type Note = {
  id: number;
  text: string;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

export const notesApi = {
  list: () => request<Note[]>(''),
  create: (text: string) => request<Note>('', { method: 'POST', body: JSON.stringify({ text }) }),
  update: (id: number, text: string) =>
    request<Note>(`/${id}`, { method: 'PATCH', body: JSON.stringify({ text }) }),
  remove: (id: number) => request<void>(`/${id}`, { method: 'DELETE' }),
};
