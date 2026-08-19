import { randomUUID } from "crypto"
import { mkdir, writeFile, unlink } from "fs/promises"
import path from "path"
import { existsSync } from "fs"

const ALLOWED_MIME_TYPES: Record<string, "IMAGE" | "VIDEO"> = {
  "image/jpeg": "IMAGE",
  "image/png": "IMAGE",
  "image/webp": "IMAGE",
  "video/mp4": "VIDEO",
  "video/webm": "VIDEO",
}

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
}

export function toPublicUrl(fileName: string): string {
  return `/api/uploads/${fileName}`
}

export function getUploadDir(): string {
  const dir = process.env.UPLOAD_DIR ?? "./uploads"
  return path.isAbsolute(dir) ? dir : path.join(process.cwd(), dir)
}

export function getMaxUploadSizeBytes(): number {
  const mb = Number(process.env.MAX_UPLOAD_SIZE_MB ?? 100)
  return mb * 1024 * 1024
}

export class UploadValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "UploadValidationError"
  }
}

export function resolveContentType(mimeType: string): "IMAGE" | "VIDEO" {
  const type = ALLOWED_MIME_TYPES[mimeType]
  if (!type) {
    throw new UploadValidationError(
      "Tipe file tidak didukung. Gunakan JPG, PNG, WebP, MP4, atau WebM."
    )
  }
  return type
}

export function validateFileSize(sizeBytes: number): void {
  const max = getMaxUploadSizeBytes()
  if (sizeBytes > max) {
    throw new UploadValidationError(
      `Ukuran file melebihi batas maksimum ${Math.round(max / 1024 / 1024)} MB.`
    )
  }
}

export async function saveUploadedFile(file: File): Promise<{
  filePath: string
  publicPath: string
  mimeType: string
  sizeBytes: number
}> {
  validateFileSize(file.size)
  resolveContentType(file.type)

  const uploadDir = getUploadDir()
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true })
  }

  const ext = EXT_BY_MIME[file.type] ?? ""
  const fileName = `${randomUUID()}${ext}`
  const absolutePath = path.join(uploadDir, fileName)

  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(absolutePath, buffer)

  return {
    filePath: fileName,
    publicPath: `/api/uploads/${fileName}`,
    mimeType: file.type,
    sizeBytes: file.size,
  }
}

export async function deleteUploadedFile(fileName: string): Promise<void> {
  const uploadDir = getUploadDir()
  const absolutePath = path.join(uploadDir, fileName)
  if (existsSync(absolutePath)) {
    await unlink(absolutePath)
  }
}
