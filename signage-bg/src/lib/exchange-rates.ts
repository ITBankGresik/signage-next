import { prisma } from "@/lib/prisma"

const CONFIG_KEY = "exchangeRates"
const PREV_CLOSE_KEY = "exchangeRatesPrevClose"
const CACHE_TTL_MS = 6 * 60 * 60 * 1000 // 6 hours
const TRACKED_CURRENCIES = ["USD", "EUR", "SGD", "JPY"] as const

type Rates = Record<(typeof TRACKED_CURRENCIES)[number], number>

export type ExchangeRates = {
  fetchedAt: string
  base: "IDR"
  rates: Rates
  prevClose: Rates
}

type PrevClose = {
  date: string
  rates: Rates
}

async function fetchFromProvider(): Promise<Omit<ExchangeRates, "prevClose">> {
  const res = await fetch("https://open.er-api.com/v6/latest/USD", { cache: "no-store" })
  if (!res.ok) throw new Error(`Exchange rate provider returned ${res.status}`)

  const data = (await res.json()) as { rates?: Record<string, number> }
  const usdToIdr = data.rates?.IDR
  if (!usdToIdr) throw new Error("IDR rate missing from provider response")

  const rates = {} as Rates
  for (const currency of TRACKED_CURRENCIES) {
    const usdToCurrency = currency === "USD" ? 1 : data.rates?.[currency]
    if (!usdToCurrency) continue
    rates[currency] = usdToIdr / usdToCurrency
  }

  return { fetchedAt: new Date().toISOString(), base: "IDR", rates }
}

async function resolvePrevClose(now: Date, lastKnownRates: Rates | null): Promise<PrevClose> {
  const todayStr = now.toISOString().slice(0, 10)
  const row = await prisma.systemConfig.findUnique({ where: { key: PREV_CLOSE_KEY } })
  const stored = row ? (JSON.parse(row.value) as PrevClose) : null

  if (stored && stored.date === todayStr) return stored

  // First run ever, or a new day has started: roll the baseline forward.
  // The last known rates (from before this refresh) represent yesterday's close.
  const rolled: PrevClose = { date: todayStr, rates: lastKnownRates ?? stored?.rates ?? ({} as Rates) }
  await prisma.systemConfig.upsert({
    where: { key: PREV_CLOSE_KEY },
    create: { key: PREV_CLOSE_KEY, value: JSON.stringify(rolled) },
    update: { value: JSON.stringify(rolled) },
  })
  return rolled
}

export async function getExchangeRates(): Promise<ExchangeRates> {
  const cachedRow = await prisma.systemConfig.findUnique({ where: { key: CONFIG_KEY } })
  const cached = cachedRow ? (JSON.parse(cachedRow.value) as Omit<ExchangeRates, "prevClose">) : null
  const now = new Date()

  let current = cached
  let isFresh = false
  if (cached && Date.now() - new Date(cached.fetchedAt).getTime() < CACHE_TTL_MS) {
    isFresh = true
  } else {
    try {
      current = await fetchFromProvider()
    } catch (err) {
      if (!cached) throw err
      current = cached
    }
  }

  if (!current) throw new Error("Unable to resolve exchange rates")

  if (!isFresh) {
    await prisma.systemConfig.upsert({
      where: { key: CONFIG_KEY },
      create: { key: CONFIG_KEY, value: JSON.stringify(current) },
      update: { value: JSON.stringify(current) },
    })
  }

  const prevClose = await resolvePrevClose(now, cached?.rates ?? null)

  return { ...current, prevClose: prevClose.rates }
}
