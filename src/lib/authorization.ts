import { prisma } from "./db";

/**
 * Verifies that the given optional resource ids belong to the specified owner.
 * Passing an undefined/empty id for a resource is allowed (means "not linked").
 *
 * This prevents IDOR-style attacks where a user creates a record linked to
 * another user's case/client by guessing their id.
 */
export async function userOwnsResources(
  userId: string,
  refs: { caseId?: string | null; clientId?: string | null }
): Promise<boolean> {
  if (refs.caseId) {
    const c = await prisma.case.findFirst({
      where: { id: refs.caseId, ownerId: userId },
      select: { id: true },
    });
    if (!c) return false;
  }
  if (refs.clientId) {
    const cl = await prisma.client.findFirst({
      where: { id: refs.clientId, ownerId: userId },
      select: { id: true },
    });
    if (!cl) return false;
  }
  return true;
}
