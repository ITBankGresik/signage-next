import { prisma } from "@/lib/prisma"

const CONFIG_KEY = "exchangeRates"
const CACHE_TTL_MS = 6 * 60 * 60 * 1000 // 6 hours
const TRACKED_CURRENCIES = ["USD", "EUR", "SGD", "JPY"] as const

export type ExchangeRates = {
  fetchedAt: string
  base: "IDR"
  rates: Record<(typeof TRACKED_CURRENCIES)[number], number>
}

async function fetchFromProvider(): Promise<ExchangeRates> {
  const res = await fetch("https://open.er-api.com/v6/latest/USD", { cache: "no-store" })
  if (!res.ok) throw new Error(`Exchange rate provider returned ${res.status}`)

  const data = (await res.json()) as { rates?: Record<string, number> }
  const usdToIdr = data.rates?.IDR
  if (!usdToIdr) throw new Error("IDR rate missing from provider response")

  const rates = {} as ExchangeRates["rates"]
  for (const currency of TRACKED_CURRENCIES) {
    const usdToCurrency = currency === "USD" ? 1 : data.rates?.[currency]
    if (!usdToCurrency) continue
    rates[currency] = usdToIdr / usdToCurrency
  }

  return { fetchedAt: new Date().toISOString(), base: "IDR", rates }
}

export async function getExchangeRates(): Promise<ExchangeRates> {
  const cached = await prisma.systemConfig.findUnique({ where: { key: CONFIG_KEY } })

  if (cached) {
    const parsed = JSON.parse(cached.value) as ExchangeRates
    const age = Date.now() - new Date(parsed.fetchedAt).getTime()
    if (age < CACHE_TTL_MS) return parsed
  }

  try {
    const fresh = await fetchFromProvider()
    await prisma.systemConfig.upsert({
      where: { key: CONFIG_KEY },
      create: { key: CONFIG_KEY, value: JSON.stringify(fresh) },
      update: { value: JSON.stringify(fresh) },
    })
    return fresh
  } catch (err) {
    if (cached) return JSON.parse(cached.value) as ExchangeRates
    throw err
  }
}
