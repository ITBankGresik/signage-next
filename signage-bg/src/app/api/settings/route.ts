import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { createLog } from "@/lib/activity-log"
import { toPublicUrl } from "@/lib/upload"

export const dynamic = "force-dynamic"

const KNOWN_KEYS = [
  "systemName",
  "defaultTickerSpeed",
  "heartbeatIntervalSeconds",
  "fallbackPlaylistId",
  "officeHours",
  "promoBanners",
] as const

export async function GET(): Promise<NextResponse> {
  const rows = await prisma.systemConfig.findMany({ where: { key: { in: [...KNOWN_KEYS] } } })
  const settings: Record<string, string> = {}
  for (const row of rows) settings[row.key] = row.value
  return NextResponse.json(settings)
}

const patchSchema = z.object({
  systemName: z.string().min(1).optional(),
  defaultTickerSpeed: z.coerce.number().int().positive().optional(),
  heartbeatIntervalSeconds: z.coerce.number().int().positive().optional(),
  fallbackPlaylistId: z.string().optional(),
  officeHours: z
    .array(z.object({ label: z.string().min(1), hours: z.string().min(1) }))
    .optional(),
  promoBanners: z.array(z.object({ contentId: z.string().min(1) })).optional(),
})

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = patchSchema.parse(await req.json())

    const resolvedBody: Record<string, unknown> = { ...body }
    if (body.promoBanners) {
      const contents = await prisma.content.findMany({
        where: { id: { in: body.promoBanners.map((b) => b.contentId) }, type: "IMAGE" },
      })
      const byId = new Map(contents.map((c) => [c.id, c]))
      resolvedBody.promoBanners = body.promoBanners
        .filter((b) => byId.has(b.contentId))
        .map((b) => {
          const content = byId.get(b.contentId)!
          return { contentId: content.id, filePath: toPublicUrl(content.filePath), name: content.name }
        })
    }

    await Promise.all(
      Object.entries(resolvedBody).map(([key, value]) => {
        const serialized = typeof value === "string" ? value : JSON.stringify(value)
        return prisma.systemConfig.upsert({
          where: { key },
          update: { value: serialized },
          create: { key, value: serialized },
        })
      })
    )

    await createLog(session.user.id, "SETTINGS_UPDATE", "SystemConfig", "settings", body)

    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Data tidak valid", code: "VALIDATION" }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: "Gagal menyimpan pengaturan" }, { status: 500 })
  }
}
