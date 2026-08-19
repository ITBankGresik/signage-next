import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { createLog } from "@/lib/activity-log"

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export async function GET(): Promise<NextResponse> {
  const screens = await prisma.screen.findMany({
    orderBy: { createdAt: "desc" },
    include: { layout: true },
  })
  return NextResponse.json({ data: screens })
}

const createSchema = z.object({
  name: z.string().min(1),
  location: z.string().min(1),
  layoutId: z.string().min(1),
  slug: z.string().optional(),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = createSchema.parse(await req.json())
    const slug = body.slug ? slugify(body.slug) : slugify(body.name)

    const screen = await prisma.screen.create({
      data: {
        name: body.name,
        location: body.location,
        layoutId: body.layoutId,
        slug,
        status: "OFFLINE",
      },
    })

    await createLog(session.user.id, "SCREEN_REGISTER", "Screen", screen.id, { name: screen.name })

    return NextResponse.json(screen, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Data tidak valid", code: "VALIDATION" }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: "Gagal mendaftarkan layar" }, { status: 500 })
  }
}
