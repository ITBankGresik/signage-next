import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { createLog } from "@/lib/activity-log"

export async function GET(): Promise<NextResponse> {
  const tickers = await prisma.ticker.findMany({ orderBy: { order: "asc" } })
  return NextResponse.json({ data: tickers })
}

const createSchema = z.object({
  text: z.string().min(1),
  speed: z.number().int().positive().default(60),
  color: z.string().default("#FFFFFF"),
  isActive: z.boolean().default(true),
  order: z.number().int().default(0),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = createSchema.parse(await req.json())
    const ticker = await prisma.ticker.create({ data: body })
    await createLog(session.user.id, "TICKER_UPDATE", "Ticker", ticker.id, { text: ticker.text })

    const { broadcastAll } = await import("@/lib/sse")
    broadcastAll({ type: "ticker_update" })

    return NextResponse.json(ticker, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Data tidak valid", code: "VALIDATION" }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: "Gagal membuat ticker" }, { status: 500 })
  }
}
