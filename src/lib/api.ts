export async function apiFetch(url: string, options?: RequestInit) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };

  const userId = (globalThis as unknown as { __USER_ID__?: string }).__USER_ID__;
  if (userId) {
    headers["x-user-id"] = userId;
  }

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}
