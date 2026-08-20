type ScheduleLike = {
  recurrence: "ONCE" | "DAILY"
  startAt: Date
  endAt: Date
  recurrenceUntil: Date | null
}

function minutesOfDayUTC(date: Date): number {
  return date.getUTCHours() * 60 + date.getUTCMinutes()
}

function startOfUTCDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

export function isScheduleActiveNow(schedule: ScheduleLike, now: Date): boolean {
  if (schedule.recurrence === "ONCE") {
    return schedule.startAt <= now && schedule.endAt >= now
  }

  // DAILY: startAt's date marks "effective from", recurrenceUntil (if set) marks
  // "effective until" (inclusive). Only the time-of-day portions of startAt/endAt
  // matter for the daily window; overnight windows (endAt time < startAt time)
  // are not supported.
  const effectiveFrom = startOfUTCDay(schedule.startAt)
  if (now < effectiveFrom) return false
  if (schedule.recurrenceUntil) {
    const effectiveUntilEnd = new Date(startOfUTCDay(schedule.recurrenceUntil).getTime() + 24 * 60 * 60 * 1000 - 1)
    if (now > effectiveUntilEnd) return false
  }

  const nowMinutes = minutesOfDayUTC(now)
  const startMinutes = minutesOfDayUTC(schedule.startAt)
  const endMinutes = minutesOfDayUTC(schedule.endAt)
  return nowMinutes >= startMinutes && nowMinutes <= endMinutes
}
