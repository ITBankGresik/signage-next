export type UserRole = "ADMIN" | "OPERATOR"

export type ContentType = "IMAGE" | "VIDEO"

export type ContentCategory = "PROMO" | "INFO" | "EVENT" | "IDLE"

export type ScheduleStatus = "DRAFT" | "ACTIVE" | "EXPIRED"

export type ScreenStatus = "ONLINE" | "OFFLINE" | "IDLE"

export type SchedulePriority = "LOW" | "MEDIUM" | "HIGH"

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  createdAt: string
}

export interface Screen {
  id: string
  name: string
  slug: string
  location: string
  status: ScreenStatus
  layoutId: string
  lastSeenAt: string | null
  createdAt: string
}

export interface Content {
  id: string
  name: string
  type: ContentType
  filePath: string
  mimeType: string
  duration: number
  sizeBytes: number
  category: ContentCategory
  createdAt: string
  updatedAt: string
}

export interface Playlist {
  id: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
}

export interface PlaylistItem {
  id: string
  playlistId: string
  contentId: string
  order: number
  durationOverride: number | null
  content?: Content
}

export interface Schedule {
  id: string
  screenId: string
  playlistId: string
  startAt: string
  endAt: string
  priority: SchedulePriority
  status: ScheduleStatus
  createdAt: string
}

export interface Ticker {
  id: string
  text: string
  speed: number
  color: string
  isActive: boolean
  order: number
  createdAt: string
}

export type ZoneType = "main" | "sidebar" | "ticker" | "clock"
export type ZonePosition = "top" | "bottom" | "left" | "right" | "full"

export interface Zone {
  id: string
  type: ZoneType
  position: ZonePosition
  width?: string
  height?: string
}

export interface ZoneConfig {
  zones: Zone[]
}

export interface Layout {
  id: string
  name: string
  zones: ZoneConfig
  isDefault: boolean
  createdAt: string
}

export interface ActivityLog {
  id: string
  userId: string
  action: string
  entity: string
  entityId: string
  meta: Record<string, unknown> | null
  createdAt: string
}

export interface ApiError {
  error: string
  code?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  perPage: number
}

export type SseEventType =
  | "schedule_update"
  | "ticker_update"
  | "screen_config_update"
  | "ping"

export interface SseEvent<T = unknown> {
  type: SseEventType
  payload?: T
}
