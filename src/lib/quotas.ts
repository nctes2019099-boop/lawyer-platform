import { prisma } from "./db";

export type QuotaKey = "maxCases" | "maxClients" | "maxStorageMb";

interface Limits {
  maxCases?: number;
  maxClients?: number;
  maxStorageMb?: number;
  // Legacy/short key names used by some seeded plans.
  cases?: number;
  clients?: number;
  storageMb?: number;
}

function pick<T extends Record<string, unknown>>(obj: T, ...keys: string[]): number | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
  }
  return undefined;
}

/**
 * Returns the effective limits for a user's ACTIVE subscription.
 * -1 (or missing) means unlimited. If no subscription exists, a permissive
 * fallback is used (treated as the free tier baseline).
 */
export async function getUserLimits(userId: string): Promise<Limits> {
  const sub = await prisma.subscription.findUnique({
    where: { userId },
    include: { plan: true },
  });

  if (sub && sub.status === "ACTIVE" && sub.plan) {
    const parsed =
      typeof sub.plan.limits === "string"
        ? safeParse(sub.plan.limits)
        : (sub.plan.limits as Limits | null);
    if (parsed) return parsed;
  }

  // No active plan — use the free plan's limits if one exists, else unlimited.
  const freePlan = await prisma.subscriptionPlan.findFirst({
    where: { isActive: true, price: 0 },
    orderBy: { sortOrder: "asc" },
  });
  if (freePlan) {
    const parsed =
      typeof freePlan.limits === "string"
        ? safeParse(freePlan.limits)
        : (freePlan.limits as Limits | null);
    if (parsed) return parsed;
  }
  return {};
}

function safeParse(raw: string): Limits | null {
  try {
    return JSON.parse(raw) as Limits;
  } catch {
    return null;
  }
}

export interface QuotaCheck {
  allowed: boolean;
  limit?: number;
  current: number;
  /** Human-readable, Arabic error when the quota has been exceeded. */
  message?: string;
}

/**
 * Check whether a user may create one more of a countable resource.
 * Returns { allowed: true } when unlimited or under quota.
 */
export async function checkQuota(
  userId: string,
  key: QuotaKey,
  currentCount: number,
  opts?: { isAdmin?: boolean }
): Promise<QuotaCheck> {
  // Administrators are never constrained by plan quotas (they manage the
  // platform). This also keeps seeded demo data usable.
  if (opts?.isAdmin) {
    return { allowed: true, current: currentCount };
  }
  const limits = await getUserLimits(userId);
  const map: Record<QuotaKey, string[]> = {
    maxCases: ["maxCases", "cases"],
    maxClients: ["maxClients", "clients"],
    maxStorageMb: ["maxStorageMb", "storageMb"],
  };
  const max = pick(limits as Record<string, unknown>, ...map[key]);
  if (max === undefined || max === null || max < 0) {
    return { allowed: true, current: currentCount };
  }
  if (currentCount >= max) {
    const labels: Record<QuotaKey, string> = {
      maxCases: "القضايا",
      maxClients: "العملاء",
      maxStorageMb: "مساحة التخزين",
    };
    return {
      allowed: false,
      limit: max,
      current: currentCount,
      message: `بلغت الحد الأقصى لخطتك (${max} ${labels[key]}). يمكنك الترقية لزيادة الحد.`,
    };
  }
  return { allowed: true, limit: max, current: currentCount };
}
