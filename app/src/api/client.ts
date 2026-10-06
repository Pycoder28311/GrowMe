import { Platform } from 'react-native';
import { authClient } from '@/lib/auth-client';

const API_URL = `${process.env.EXPO_PUBLIC_API_URL}/api`;

/** One API call: sends the session (cookie on web, header on phones) and parses the JSON answer */
export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const isJson = typeof init?.body === 'string';
  // Phone: the session lives in secure storage, so send it as a header. Web: the browser sends the cookie.
  const cookie = Platform.OS === 'web' ? null : await authClient.getCookie();

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: Platform.OS === 'web' ? 'include' : 'omit',
    headers: {
      ...(isJson ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return (res.status === 204 ? undefined : await res.json()) as T;
}
