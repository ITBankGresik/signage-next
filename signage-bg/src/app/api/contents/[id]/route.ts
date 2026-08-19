import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { deleteUploadedFile } from "@/lib/upload"
import { createLog } from "@/lib/activity-log"
import { serializeContent } from "@/lib/serialize"

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const content = await prisma.content.findUnique({ where: { id: params.id } })
  if (!content) {
    return NextResponse.json({ error: "Konten tidak ditemukan" }, { status: 404 })
  }
  return NextResponse.json(serializeContent(content))
}

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.enum(["PROMO", "INFO", "EVENT", "IDLE"]).optional(),
  duration: z.number().int().positive().optional(),
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
    const content = await prisma.content.update({ where: { id: params.id }, data: body })
    await createLog(session.user.id, "CONTENT_UPDATE", "Content", content.id, body)
    return NextResponse.json(serializeContent(content))
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Data tidak valid", code: "VALIDATION" }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: "Gagal memperbarui konten" }, { status: 500 })
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
    const content = await prisma.content.findUnique({ where: { id: params.id } })
    if (!content) {
      return NextResponse.json({ error: "Konten tidak ditemukan" }, { status: 404 })
    }

    await prisma.content.delete({ where: { id: params.id } })
    await deleteUploadedFile(content.filePath)
    await createLog(session.user.id, "CONTENT_DELETE", "Content", content.id, { name: content.name })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Gagal menghapus konten" }, { status: 500 })
  }
}
