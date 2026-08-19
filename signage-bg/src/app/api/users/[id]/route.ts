import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { createLog } from "@/lib/activity-log"

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(["ADMIN", "OPERATOR"]).optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Hanya admin yang bisa mengakses" }, { status: 403 })
  }

  try {
    const body = patchSchema.parse(await req.json())

    if (params.id === session.user.id && body.role) {
      return NextResponse.json(
        { error: "Tidak bisa mengubah role sendiri", code: "SELF_ROLE_CHANGE" },
        { status: 400 }
      )
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: body,
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    })
    await createLog(session.user.id, "USER_UPDATE", "User", user.id, body)
    return NextResponse.json(user)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Data tidak valid", code: "VALIDATION" }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: "Gagal memperbarui pengguna" }, { status: 500 })
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
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Hanya admin yang bisa mengakses" }, { status: 403 })
  }
  if (params.id === session.user.id) {
    return NextResponse.json(
      { error: "Tidak bisa menghapus akun sendiri", code: "SELF_DELETE" },
      { status: 400 }
    )
  }

  try {
    const user = await prisma.user.delete({ where: { id: params.id } })
    await createLog(session.user.id, "USER_DELETE", "User", user.id, { email: user.email })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Gagal menghapus pengguna" }, { status: 500 })
  }
}
