import { prisma } from "@/lib/prisma"

const CONFIG_KEY = "stockQuotes"
const CACHE_TTL_MS = 60 * 1000 // 1 minute

const SYMBOLS = [
  { symbol: "^JKSE", label: "IHSG" },
  { symbol: "BBCA.JK", label: "BBCA" },
  { symbol: "BBRI.JK", label: "BBRI" },
  { symbol: "BMRI.JK", label: "BMRI" },
  { symbol: "BBNI.JK", label: "BBNI" },
] as const

export type StockQuote = {
  symbol: string
  label: string
  price: number
  change: number
  changePercent: number
}

export type StockQuotes = {
  fetchedAt: string
  quotes: StockQuote[]
}

async function fetchQuote(symbol: string, label: string): Promise<StockQuote | null> {
  const res = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d`,
    { cache: "no-store", headers: { "User-Agent": "Mozilla/5.0" } }
  )
  if (!res.ok) return null

  const data = await res.json()
  const meta = data?.chart?.result?.[0]?.meta
  if (!meta || typeof meta.regularMarketPrice !== "number") return null

  const price = meta.regularMarketPrice
  const prevClose = meta.previousClose ?? meta.chartPreviousClose ?? price
  const change = price - prevClose
  const changePercent = prevClose ? (change / prevClose) * 100 : 0

  return { symbol, label, price, change, changePercent }
}

async function fetchFromProvider(): Promise<StockQuotes> {
  const results = await Promise.all(SYMBOLS.map((s) => fetchQuote(s.symbol, s.label)))
  const quotes = results.filter((q): q is StockQuote => q !== null)
  if (quotes.length === 0) throw new Error("No stock quotes returned by provider")
  return { fetchedAt: new Date().toISOString(), quotes }
}

export async function getStockQuotes(): Promise<StockQuotes> {
  const cached = await prisma.systemConfig.findUnique({ where: { key: CONFIG_KEY } })

  if (cached) {
    const parsed = JSON.parse(cached.value) as StockQuotes
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
    if (cached) return JSON.parse(cached.value) as StockQuotes
    throw err
  }
}
