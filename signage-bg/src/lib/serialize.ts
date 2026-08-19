import type { Content, PlaylistItem } from "@prisma/client"
import { toPublicUrl } from "@/lib/upload"

export function serializeContent<T extends Content>(content: T): T {
  return { ...content, filePath: toPublicUrl(content.filePath) }
}

export function serializePlaylistItem<T extends PlaylistItem & { content: Content }>(
  item: T
): T {
  return { ...item, content: serializeContent(item.content) }
}
