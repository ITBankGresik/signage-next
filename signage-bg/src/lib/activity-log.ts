import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"

export async function createLog(
  userId: string,
  action: string,
  entity: string,
  entityId: string,
  meta?: Record<string, unknown>
): Promise<void> {
  await prisma.activityLog.create({
    data: {
      userId,
      action,
      entity,
      entityId,
      meta: (meta as Prisma.InputJsonValue) ?? undefined,
    },
  })
}
