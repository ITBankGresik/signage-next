import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { createLog } from "@/lib/activity-log"
import type { Prisma } from "@prisma/client"

const querySchema = z.object({
  screenId: z.string().optional(),
  date: z.string().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "EXPIRED"]).optional(),
})

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url)
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams))

  if (!parsed.success) {
    return NextResponse.json({ error: "Query tidak valid", code: "VALIDATION" }, { status: 400 })
  }

  const { screenId, date, status } = parsed.data

  const where: Prisma.ScheduleWhereInput = {
    ...(screenId ? { screenId } : {}),
    ...(status ? { status } : {}),
  }

  if (date) {
    const dayStart = new Date(`${date}T00:00:00.000Z`)
    const dayEnd = new Date(`${date}T23:59:59.999Z`)
    where.AND = [{ startAt: { lte: dayEnd } }, { endAt: { gte: dayStart } }]
  }

  const schedules = await prisma.schedule.findMany({
    where,
    orderBy: { startAt: "asc" },
    include: { screen: true, playlist: true },
  })

  return NextResponse.json({ data: schedules })
}

const createSchema = z
  .object({
    screenId: z.string().min(1),
    playlistId: z.string().min(1),
    startAt: z.coerce.date(),
    endAt: z.coerce.date(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
    status: z.enum(["DRAFT", "ACTIVE", "EXPIRED"]).default("DRAFT"),
  })
  .refine((data) => data.endAt > data.startAt, {
    message: "Waktu selesai harus setelah waktu mulai",
    path: ["endAt"],
  })

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = createSchema.parse(await req.json())

    const overlapping = await prisma.schedule.findFirst({
      where: {
        screenId: body.screenId,
        priority: body.priority,
        status: { in: ["DRAFT", "ACTIVE"] },
        startAt: { lt: body.endAt },
        endAt: { gt: body.startAt },
      },
    })

    if (overlapping) {
      return NextResponse.json(
        {
          error: "Jadwal bertabrakan dengan jadwal lain dengan prioritas sama di layar ini",
          code: "SCHEDULE_OVERLAP",
        },
        { status: 409 }
      )
    }

    const schedule = await prisma.schedule.create({ data: body })
    await createLog(session.user.id, "SCHEDULE_CREATE", "Schedule", schedule.id, {
      screenId: schedule.screenId,
      playlistId: schedule.playlistId,
    })

    return NextResponse.json(schedule, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message ?? "Data tidak valid", code: "VALIDATION" },
        { status: 400 }
      )
    }
    console.error(err)
    return NextResponse.json({ error: "Gagal membuat jadwal" }, { status: 500 })
  }
}
