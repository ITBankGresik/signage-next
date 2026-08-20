import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { broadcast } from "@/lib/sse"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = req.headers.get("x-internal-secret")
  if (!secret || secret !== process.env.NEXTAUTH_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const sinceHeader = req.headers.get("x-tick-since")
  const since = sinceHeader ? new Date(sinceHeader) : new Date(now.getTime() - 60_000)

  const expired = await prisma.schedule.findMany({
    where: { status: "ACTIVE", recurrence: "ONCE", endAt: { lt: now } },
    select: { id: true, screenId: true },
  })

  const expiredRecurring = await prisma.schedule.findMany({
    where: { status: "ACTIVE", recurrence: "DAILY", recurrenceUntil: { lt: now } },
    select: { id: true, screenId: true },
  })

  const justStarted = await prisma.schedule.findMany({
    where: { status: "ACTIVE", recurrence: "ONCE", startAt: { gt: since, lte: now }, endAt: { gte: now } },
    select: { id: true, screenId: true },
  })

  if (expired.length + expiredRecurring.length > 0) {
    await prisma.schedule.updateMany({
      where: { id: { in: [...expired, ...expiredRecurring].map((s) => s.id) } },
      data: { status: "EXPIRED" },
    })
  }

  if (expired.length + expiredRecurring.length + justStarted.length > 0) {
    const affectedScreenIds = new Set(
      [...expired, ...expiredRecurring, ...justStarted].map((s) => s.screenId)
    )
    for (const screenId of affectedScreenIds) {
      broadcast(screenId, { type: "schedule_update" })
    }
  }

  const configuredTimeout = await prisma.systemConfig.findUnique({
    where: { key: "heartbeatIntervalSeconds" },
  })
  const timeoutSeconds = Number(
    configuredTimeout?.value ?? process.env.HEARTBEAT_TIMEOUT_SECONDS ?? 120
  )
  const staleThreshold = new Date(now.getTime() - timeoutSeconds * 1000)

  await prisma.screen.updateMany({
    where: {
      status: { not: "OFFLINE" },
      OR: [{ lastSeenAt: { lt: staleThreshold } }, { lastSeenAt: null }],
    },
    data: { status: "OFFLINE" },
  })

  return NextResponse.json({ ok: true, expired: expired.length, justStarted: justStarted.length })
}
