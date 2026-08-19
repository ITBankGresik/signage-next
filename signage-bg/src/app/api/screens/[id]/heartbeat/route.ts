import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const screen = await prisma.screen.update({
      where: { id: params.id },
      data: { lastSeenAt: new Date(), status: "ONLINE" },
      select: { id: true, status: true, lastSeenAt: true },
    })
    return NextResponse.json(screen)
  } catch {
    return NextResponse.json({ error: "Layar tidak ditemukan" }, { status: 404 })
  }
}
