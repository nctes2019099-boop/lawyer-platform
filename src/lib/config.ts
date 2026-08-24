/**
 * Client-side configuration. When the app is wrapped as a native mobile app
 * (Capacitor) or deployed to a different origin than the API, set
 * NEXT_PUBLIC_API_URL to the absolute backend URL. In normal web usage it
 * defaults to same-origin relative URLs.
 */
export const API_BASE =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL) || "";

export function apiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

/** True when running inside a Capacitor native webview. */
export const isNative =
  typeof window !== "undefined" &&
  (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } })
    .Capacitor?.isNativePlatform?.() === true;
