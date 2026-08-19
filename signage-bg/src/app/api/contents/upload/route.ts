import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { resolveContentType, saveUploadedFile, UploadValidationError } from "@/lib/upload"
import { createLog } from "@/lib/activity-log"

const metaSchema = z.object({
  category: z.enum(["PROMO", "INFO", "EVENT", "IDLE"]).default("INFO"),
  duration: z.coerce.number().int().positive().default(10),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 })
    }

    const meta = metaSchema.parse({
      category: formData.get("category") ?? undefined,
      duration: formData.get("duration") ?? undefined,
    })

    const type = resolveContentType(file.type)
    const saved = await saveUploadedFile(file)

    const content = await prisma.content.create({
      data: {
        name: file.name,
        type,
        filePath: saved.filePath,
        mimeType: saved.mimeType,
        sizeBytes: saved.sizeBytes,
        duration: meta.duration,
        category: meta.category,
      },
    })

    await createLog(session.user.id, "CONTENT_UPLOAD", "Content", content.id, {
      name: content.name,
    })

    return NextResponse.json({
      id: content.id,
      name: content.name,
      filePath: saved.publicPath,
      type: content.type,
      sizeBytes: content.sizeBytes,
    })
  } catch (err) {
    if (err instanceof UploadValidationError) {
      return NextResponse.json({ error: err.message, code: "UPLOAD_VALIDATION" }, { status: 400 })
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Data tidak valid", code: "VALIDATION" }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: "Gagal mengunggah file" }, { status: 500 })
  }
}
