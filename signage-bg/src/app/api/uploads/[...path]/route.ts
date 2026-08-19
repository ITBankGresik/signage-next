import { NextRequest, NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { existsSync } from "fs"
import path from "path"
import { getUploadDir } from "@/lib/upload"

const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { path: string[] } }
): Promise<NextResponse> {
  const fileName = params.path.join("/")

  if (fileName.includes("..")) {
    return NextResponse.json({ error: "Path tidak valid" }, { status: 400 })
  }

  const uploadDir = getUploadDir()
  const absolutePath = path.join(uploadDir, fileName)

  if (!absolutePath.startsWith(uploadDir) || !existsSync(absolutePath)) {
    return NextResponse.json({ error: "File tidak ditemukan" }, { status: 404 })
  }

  const ext = path.extname(absolutePath).toLowerCase()
  const contentType = MIME_BY_EXT[ext] ?? "application/octet-stream"
  const buffer = await readFile(absolutePath)

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  })
}
