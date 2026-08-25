import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./db";
import { env, assertProductionSecret } from "./env";

const secret = new TextEncoder().encode(env.NEXTAUTH_SECRET);
const COOKIE_NAME = "session";

export async function createSession(userId: string) {
  assertProductionSecret();
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    // Secure cookies in production; HTTP is acceptable for local dev.
    secure: env.isProduction,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  return token;
}

export async function verifySession() {
  assertProductionSecret();
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  // Auto-login for local development ONLY. Forcibly disabled in production via env.
  if (env.DEV_AUTO_LOGIN) {
    const user = await prisma.user.findFirst({
      where: { email: "demo@lawyer.com" },
    });
    if (user) return { userId: user.id, user };
  }

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret, { clockTolerance: 60 });
    const userId = payload.userId as string;
    if (!userId) return null;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;
    return { userId, user };
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const session = await verifySession();
  return session?.user || null;
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
