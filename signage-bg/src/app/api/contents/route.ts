import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { createLog } from "@/lib/activity-log"
import { serializeContent } from "@/lib/serialize"
import type { Prisma } from "@prisma/client"

const querySchema = z.object({
  type: z.enum(["IMAGE", "VIDEO"]).optional(),
  category: z.enum(["PROMO", "INFO", "EVENT", "IDLE"]).optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(100).default(24),
})

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url)
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams))

  if (!parsed.success) {
    return NextResponse.json({ error: "Query tidak valid", code: "VALIDATION" }, { status: 400 })
  }

  const { type, category, q, page, perPage } = parsed.data

  const where: Prisma.ContentWhereInput = {
    ...(type ? { type } : {}),
    ...(category ? { category } : {}),
    ...(q ? { name: { contains: q } } : {}),
  }

  const [data, total] = await Promise.all([
    prisma.content.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.content.count({ where }),
  ])

  return NextResponse.json({ data: data.map(serializeContent), total, page, perPage })
}

const createSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["IMAGE", "VIDEO"]),
  filePath: z.string().min(1),
  mimeType: z.string().min(1),
  duration: z.number().int().positive().default(10),
  sizeBytes: z.number().int().nonnegative(),
  category: z.enum(["PROMO", "INFO", "EVENT", "IDLE"]).default("INFO"),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = createSchema.parse(await req.json())
    const content = await prisma.content.create({ data: body })
    await createLog(session.user.id, "CONTENT_CREATE", "Content", content.id, { name: content.name })
    return NextResponse.json(serializeContent(content), { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Data tidak valid", code: "VALIDATION" }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: "Gagal membuat konten" }, { status: 500 })
  }
}
