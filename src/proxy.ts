import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Security headers applied to every response.
// Auth is enforced in each API route via getCurrentUser(); proxy only
// handles response hardening. Keep it lightweight to avoid running on static.
export function proxy(_req: NextRequest) {
  const res = NextResponse.next();

  const headers = res.headers;
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "SAMEORIGIN");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("X-DNS-Prefetch-Control", "off");
  headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );
  // Only enable HSTS in production (HTTPS).
  if (process.env.NODE_ENV === "production") {
    headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains");
  }
  return res;
}

export const config = {
  // Apply to app routes but skip Next internals and static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json).*)"],
};
