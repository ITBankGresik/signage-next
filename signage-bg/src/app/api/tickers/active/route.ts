import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(): Promise<NextResponse> {
  const tickers = await prisma.ticker.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  })
  return NextResponse.json({ data: tickers })
}
