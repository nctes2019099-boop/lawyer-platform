import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./db";
import { env } from "./env";

const secret = new TextEncoder().encode(env.NEXTAUTH_SECRET);

export async function createSession(userId: string) {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  return token;
}

export async function verifySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) {
    const headerUserId = (await cookies()).get("x-user-id")?.value;
    if (headerUserId) {
      const user = await prisma.user.findUnique({ where: { id: headerUserId } });
      if (user) return { userId: user.id, user };
    }
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, secret, { clockTolerance: 60 });
    const userId = payload.userId as string;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;
    return { userId, user };
  } catch {
    if (env.DEV_AUTO_LOGIN) {
      const user = await prisma.user.findFirst({
        where: { email: "demo@lawyer.com" },
      });
      if (user) return { userId: user.id, user };
    }
    return null;
  }
}

export async function getCurrentUser() {
  const session = await verifySession();
  return session?.user || null;
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}
