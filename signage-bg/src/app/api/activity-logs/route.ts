import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const entity = searchParams.get("entity") ?? undefined
  const page = Math.max(1, Number(searchParams.get("page") ?? 1))
  const perPage = Math.min(100, Math.max(1, Number(searchParams.get("perPage") ?? 20)))

  const where = entity ? { entity } : {}

  const [data, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.activityLog.count({ where }),
  ])

  return NextResponse.json({ data, total, page, perPage })
}
