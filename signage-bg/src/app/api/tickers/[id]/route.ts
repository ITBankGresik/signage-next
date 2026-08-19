import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { createLog } from "@/lib/activity-log"

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const ticker = await prisma.ticker.findUnique({ where: { id: params.id } })
  if (!ticker) {
    return NextResponse.json({ error: "Ticker tidak ditemukan" }, { status: 404 })
  }
  return NextResponse.json(ticker)
}

const patchSchema = z.object({
  text: z.string().min(1).optional(),
  speed: z.number().int().positive().optional(),
  color: z.string().optional(),
  isActive: z.boolean().optional(),
  order: z.number().int().optional(),
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
    const ticker = await prisma.ticker.update({ where: { id: params.id }, data: body })
    await createLog(session.user.id, "TICKER_UPDATE", "Ticker", ticker.id, body)

    const { broadcastAll } = await import("@/lib/sse")
    broadcastAll({ type: "ticker_update" })

    return NextResponse.json(ticker)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Data tidak valid", code: "VALIDATION" }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: "Gagal memperbarui ticker" }, { status: 500 })
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

  try {
    const ticker = await prisma.ticker.delete({ where: { id: params.id } })
    await createLog(session.user.id, "TICKER_DELETE", "Ticker", ticker.id, { text: ticker.text })

    const { broadcastAll } = await import("@/lib/sse")
    broadcastAll({ type: "ticker_update" })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Gagal menghapus ticker" }, { status: 500 })
  }
}
