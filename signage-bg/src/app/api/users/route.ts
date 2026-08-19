import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { createLog } from "@/lib/activity-log"

export async function GET(): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Hanya admin yang bisa mengakses" }, { status: 403 })
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  })
  return NextResponse.json({ data: users })
}

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["ADMIN", "OPERATOR"]).default("OPERATOR"),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Hanya admin yang bisa mengakses" }, { status: 403 })
  }

  try {
    const body = createSchema.parse(await req.json())

    const existing = await prisma.user.findUnique({ where: { email: body.email } })
    if (existing) {
      return NextResponse.json({ error: "Email sudah terdaftar", code: "EMAIL_TAKEN" }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(body.password, 10)
    const user = await prisma.user.create({
      data: { name: body.name, email: body.email, passwordHash, role: body.role },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    })

    await createLog(session.user.id, "USER_CREATE", "User", user.id, { email: user.email, role: user.role })

    return NextResponse.json(user, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message ?? "Data tidak valid", code: "VALIDATION" },
        { status: 400 }
      )
    }
    console.error(err)
    return NextResponse.json({ error: "Gagal membuat pengguna" }, { status: 500 })
  }
}
