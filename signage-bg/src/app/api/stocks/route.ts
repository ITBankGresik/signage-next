import { NextResponse } from "next/server"
import { getStockQuotes } from "@/lib/stocks"

export const dynamic = "force-dynamic"

export async function GET(): Promise<NextResponse> {
  try {
    const data = await getStockQuotes()
    return NextResponse.json(data)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Gagal mengambil data saham" }, { status: 502 })
  }
}
