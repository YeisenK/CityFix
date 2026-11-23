import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from './tokenStorage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

type TokenPair = { accessToken: string; refreshToken: string };

async function refreshSession(): Promise<boolean> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return false;

  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    await clearTokens();
    return false;
  }

  const tokens = (await res.json()) as TokenPair;
  await saveTokens(tokens.accessToken, tokens.refreshToken);
  return true;
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const send = async (): Promise<Response> => {
    const token = await getAccessToken();
    return fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
  };

  let res = await send();

  if (res.status === 401 && (await refreshSession())) {
    res = await send();
  }

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  return (await res.json()) as T;
}