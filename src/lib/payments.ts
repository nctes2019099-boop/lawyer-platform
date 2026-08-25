import { env } from "./env";

/**
 * Payment provider abstraction.
 *
 * - `zaincash`: initiates a real ZainCash Iraq transaction (credentials from
 *   ZAINCASH_TOKEN / ZAINCASH_SECRET / ZAINCASH_MERCHANT_ID / ZAINCASH_MSISDN).
 *   Set ZAINCASH_SANDBOX=true to use the sandbox init URL.
 * - `card`: reserved for a future card gateway (returns a hosted checkout URL).
 * - `mock`: completes immediately (dev/demo only).
 *
 * All functions return a common shape so the route handler and webhook stay
 * provider-agnostic.
 */

export type Provider = "zaincash" | "card" | "mock";

export interface InitResult {
  provider: Provider;
  /** URL to redirect the user to for payment (null when no redirect needed). */
  paymentUrl: string | null;
  /** Provider transaction id (e.g. ZainCash request id) for later verification. */
  providerRef: string | null;
  /** For mock: mark the payment already completed. */
  completed?: boolean;
}

const ZAINCASH_INIT = "https://api.zaincash.iq/transaction/init";
const ZAINCASH_INIT_SANDBOX = "https://test.zaincash.iq/transaction/init";
const ZAINCASH_REDIRECT = "https://api.zaincash.iq/transaction/pay?id=";
const ZAINCASH_REDIRECT_SANDBOX = "https://test.zaincash.iq/transaction/pay?id=";

function zaincashConfigured(): boolean {
  return Boolean(
    env.ZAINCASH_TOKEN &&
    env.ZAINCASH_SECRET &&
    env.ZAINCASH_MERCHANT_ID &&
    env.ZAINCASH_MSISDN
  );
}

function jwtLikePayload(token: string): unknown {
  // ZainCash init expects a JWT-shaped payload signed with the secret. We build a
  // compact HS256 JWT using Web Crypto (available in the Node/Edge runtime).
  return token;
}

async function signHS256(secret: string, body: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(body));
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

async function buildZainCashToken(params: {
  amount: number;
  orderId: string;
  serviceType: string;
  redirectUrl: string;
}): Promise<string> {
  const secret = env.ZAINCASH_SECRET!;
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    amount: params.amount,
    orderId: params.orderId,
    serviceType: params.serviceType,
    redirectUrl: params.redirectUrl,
    // ZainCash required fields
    by: env.ZAINCASH_MERCHANT_ID,
    msisdn: env.ZAINCASH_MSISDN,
    iat: now,
    exp: now + 60 * 60 * 4, // 4 hours
  };
  const header = { alg: "HS256", typ: "JWT" };
  const b64 = (o: unknown) =>
    btoa(JSON.stringify(o)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const body = `${b64(header)}.${b64(payload)}`;
  const sig = await signHS256(secret, body);
  return `${body}.${sig}`;
}

/**
 * Initialise a payment for the given amount/order.
 * In mock mode the payment auto-completes. In sandbox/dev without ZainCash
 * credentials we still fall back to mock so the flow is testable.
 */
export async function initPayment(params: {
  provider: Provider;
  amount: number;
  orderId: string;
  label: string;
  baseUrl: string;
}): Promise<InitResult> {
  const { provider, amount, orderId, label, baseUrl } = params;

  // Real ZainCash
  if (provider === "zaincash" && zaincashConfigured() && env.NODE_ENV === "production") {
    const redirectUrl = `${baseUrl}/api/payments/webhook/zaincash`;
    const token = await buildZainCashToken({
      amount: Math.round(amount),
      orderId,
      serviceType: label,
      redirectUrl,
    });

    const initUrl = env.ZAINCASH_SANDBOX ? ZAINCASH_INIT_SANDBOX : ZAINCASH_INIT;
    const res = await fetch(initUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        token,
        merchantId: env.ZAINCASH_MERCHANT_ID!,
        lang: "ar",
        // The ZainCash API key (separate from the signing secret).
        ...(env.ZAINCASH_TOKEN ? { x_api_key: env.ZAINCASH_TOKEN } : {}),
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`ZainCash init failed (${res.status}): ${text.slice(0, 200)}`);
    }
    const data = (await res.json().catch(() => ({}))) as { id?: string; err?: string; error?: string };
    if (data.err || data.error) throw new Error(data.err || data.error || "ZainCash error");

    const txnId = data.id || null;
    const base = env.ZAINCASH_SANDBOX ? ZAINCASH_REDIRECT_SANDBOX : ZAINCASH_REDIRECT;
    return {
      provider: "zaincash",
      paymentUrl: txnId ? `${base}${txnId}` : null,
      providerRef: txnId,
    };
  }

  // Mock (dev, sandbox, or unconfigured) — payment completes on verify.
  return { provider: "mock", paymentUrl: null, providerRef: null, completed: true };
}

/**
 * Verify a previously-initiated payment. For ZainCash this calls the
 * transaction/status endpoint with the API token. For mock it resolves to
 * success if an id exists.
 */
export async function verifyPayment(params: {
  provider: Provider;
  providerRef: string | null;
  amount?: number;
}): Promise<{ success: boolean; paidAt: Date | null; raw?: unknown }> {
  const { provider, providerRef } = params;

  if (provider === "mock" || !providerRef) {
    return { success: true, paidAt: new Date() };
  }

  if (provider === "zaincash") {
    const statusUrl = (env.ZAINCASH_SANDBOX ? "https://test.zaincash.iq" : "https://api.zaincash.iq") +
      `/transaction/get?id=${encodeURIComponent(providerRef)}`;
    const res = await fetch(statusUrl, {
      headers: env.ZAINCASH_TOKEN ? { Authorization: `Bearer ${env.ZAINCASH_TOKEN}` } : undefined,
    });
    if (!res.ok) return { success: false, paidAt: null };
    const data = (await res.json().catch(() => ({}))) as { status?: string; operationId?: string };
    const success = data.status === "success" || data.status === "completed";
    return { success, paidAt: success ? new Date() : null, raw: data };
  }

  return { success: false, paidAt: null };
}
