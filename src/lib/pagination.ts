import { NextRequest } from "next/server";

/**
 * Safely parse pagination query params with bounds clamping.
 * Prevents NaN and protects the DB from unbounded `take` values.
 */
export function getPagination(
  req: NextRequest,
  opts: { defaultLimit?: number; maxLimit?: number } = {}
): { limit: number; offset: number; searchParams: URLSearchParams } {
  const { defaultLimit = 50, maxLimit = 200 } = opts;
  const sp = new URL(req.url).searchParams;

  const rawLimit = Number.parseInt(sp.get("limit") || String(defaultLimit), 10);
  const rawOffset = Number.parseInt(sp.get("offset") || "0", 10);

  const limit = Math.min(
    maxLimit,
    Math.max(1, Number.isFinite(rawLimit) ? rawLimit : defaultLimit)
  );
  const offset = Math.max(0, Number.isFinite(rawOffset) ? rawOffset : 0);

  return { limit, offset, searchParams: sp };
}
