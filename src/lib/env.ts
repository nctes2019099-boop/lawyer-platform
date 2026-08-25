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
  ZAINCASH_MERCHANT_ID: process.env.ZAINCASH_MERCHANT_ID,
  ZAINCASH_MSISDN: process.env.ZAINCASH_MSISDN,
  ZAINCASH_SANDBOX: bool(process.env.ZAINCASH_SANDBOX, true),
  // SMTP / transactional email (Resent, or any host:port SMTP relay)
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: Number(process.env.SMTP_PORT || 587),
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  SMTP_FROM: process.env.SMTP_FROM || "Mizan <no-reply@mizan.app>",
  CONTACT_EMAIL: process.env.CONTACT_EMAIL || "support@mizan.app",
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  // Canonical base URL used to build links in transactional emails.
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || "",
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || "",
  UPLOAD_DIR: process.env.UPLOAD_DIR,
  MAX_UPLOAD_MB: process.env.MAX_UPLOAD_MB || "20",
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
