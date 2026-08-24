export async function apiFetch<T = unknown>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string> | undefined),
  };

  // Auth is handled by the httpOnly session cookie. Never send a user id
  // from the client — the server derives identity from the verified JWT.
  const res = await fetch(url, {
    ...options,
    headers,
    credentials: "same-origin",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  // Handle 204 No Content
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
