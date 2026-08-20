import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { createLog } from "@/lib/activity-log"

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const schedule = await prisma.schedule.findUnique({
    where: { id: params.id },
    include: { screen: true, playlist: true },
  })

  if (!schedule) {
    return NextResponse.json({ error: "Jadwal tidak ditemukan" }, { status: 404 })
  }

  return NextResponse.json(schedule)
}

const patchSchema = z.object({
  playlistId: z.string().min(1).optional(),
  startAt: z.coerce.date().optional(),
  endAt: z.coerce.date().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  status: z.enum(["DRAFT", "ACTIVE", "EXPIRED"]).optional(),
  recurrence: z.enum(["ONCE", "DAILY"]).optional(),
  recurrenceUntil: z.coerce.date().nullable().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = patchSchema.parse(await req.json())
    const schedule = await prisma.schedule.update({ where: { id: params.id }, data: body })
    await createLog(session.user.id, "SCHEDULE_UPDATE", "Schedule", schedule.id, body)
    return NextResponse.json(schedule)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Data tidak valid", code: "VALIDATION" }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: "Gagal memperbarui jadwal" }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const schedule = await prisma.schedule.findUnique({ where: { id: params.id } })
  if (!schedule) {
    return NextResponse.json({ error: "Jadwal tidak ditemukan" }, { status: 404 })
  }

  await prisma.schedule.delete({ where: { id: params.id } })
  await createLog(session.user.id, "SCHEDULE_DELETE", "Schedule", params.id, {
    screenId: schedule.screenId,
  })

  return NextResponse.json({ success: true })
}
