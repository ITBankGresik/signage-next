import cron from "node-cron"

let started = false
let lastTick: Date | null = null

async function tick(): Promise<void> {
  const now = new Date()
  const since = lastTick ?? new Date(now.getTime() - 60_000)
  lastTick = now

  const port = process.env.PORT ?? "3000"
  try {
    await fetch(`http://127.0.0.1:${port}/api/internal/scheduler-tick`, {
      method: "POST",
      headers: {
        "x-internal-secret": process.env.NEXTAUTH_SECRET ?? "",
        "x-tick-since": since.toISOString(),
      },
    })
  } catch (err) {
    console.error("[scheduler] tick request failed:", err)
  }
}

export function startScheduler(): void {
  if (started) return
  started = true

  const cronExpr = process.env.SCHEDULER_INTERVAL_CRON ?? "* * * * *"
  cron.schedule(cronExpr, () => {
    tick().catch((err) => console.error("[scheduler] tick failed:", err))
  })

  console.log(`[scheduler] started with cron "${cronExpr}"`)
}
