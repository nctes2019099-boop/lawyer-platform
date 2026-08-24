function bool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value === "true" || value === "1";
}

const isProduction = process.env.NODE_ENV === "production";

export const env = {
  DATABASE_URL: process.env.DATABASE_URL || "file:./dev.db",
  // In production a secret MUST be provided. In development we fall back to a
  // clearly-development-only value so the app still boots locally.
  NEXTAUTH_SECRET:
    process.env.NEXTAUTH_SECRET ||
    (isProduction ? "" : "lawyer-platform-dev-secret-change-me"),
  // Auto-login is a DEVELOPMENT-ONLY convenience. It is forcibly disabled in
  // production regardless of the env value to prevent unauthenticated access.
  DEV_AUTO_LOGIN: bool(process.env.DEV_AUTO_LOGIN, false) && !isProduction,
  NODE_ENV: process.env.NODE_ENV || "development",
  isProduction,
  WEBHOOK_SECRET: process.env.WEBHOOK_SECRET,
  WEBHOOK_ALLOWED_IPS: process.env.WEBHOOK_ALLOWED_IPS?.split(",") || [],
  PAYMENT_PROVIDER: process.env.PAYMENT_PROVIDER || "mock",
  ZAINCASH_TOKEN: process.env.ZAINCASH_TOKEN,
  ZAINCASH_SECRET: process.env.ZAINCASH_SECRET,
} as const;

/**
 * Throws if the app is running in production without a proper session secret.
 * Called lazily at request time (not at module import) so `next build` can run
 * without the secret being present. The first authenticated request will fail
 * loudly if the deployment is misconfigured.
 */
export function assertProductionSecret() {
  if (isProduction && (!env.NEXTAUTH_SECRET || env.NEXTAUTH_SECRET.length < 16)) {
    throw new Error(
      "NEXTAUTH_SECRET must be set to a strong random value (>= 16 chars) in production."
    );
  }
}
