export const API_BASE: string =
  process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000';

export async function apiFetch(path: string, init?: RequestInit) {
  const url = `${API_BASE}${path}`;
  return fetch(url, init);
}




