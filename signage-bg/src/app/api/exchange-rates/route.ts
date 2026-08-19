import { NextResponse } from "next/server"
import { getExchangeRates } from "@/lib/exchange-rates"

export const dynamic = "force-dynamic"

export async function GET(): Promise<NextResponse> {
  try {
    const data = await getExchangeRates()
    return NextResponse.json(data)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Gagal mengambil kurs mata uang" }, { status: 502 })
  }
}
