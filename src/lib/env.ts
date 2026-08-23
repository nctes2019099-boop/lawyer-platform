export const env = {
  DATABASE_URL: process.env.DATABASE_URL || "file:./dev.db",
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || "lawyer-platform-secret",
  DEV_AUTO_LOGIN: process.env.DEV_AUTO_LOGIN === "true",
  NODE_ENV: process.env.NODE_ENV || "development",
  WEBHOOK_SECRET: process.env.WEBHOOK_SECRET,
  WEBHOOK_ALLOWED_IPS: process.env.WEBHOOK_ALLOWED_IPS?.split(",") || [],
  PAYMENT_PROVIDER: process.env.PAYMENT_PROVIDER || "mock",
  ZAINCASH_TOKEN: process.env.ZAINCASH_TOKEN,
  ZAINCASH_SECRET: process.env.ZAINCASH_SECRET,
};
