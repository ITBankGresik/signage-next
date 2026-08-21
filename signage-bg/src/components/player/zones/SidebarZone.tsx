"use client";

import { useEffect, useState } from "react";

const CURRENCY_LABEL: Record<string, string> = {
  USD: "USD",
  EUR: "EUR",
  SGD: "SGD",
  JPY: "JPY (100)",
};
const CURRENCY_FLAG: Record<string, string> = {
  USD: "🇺🇸",
  EUR: "🇪🇺",
  SGD: "🇸🇬",
  JPY: "🇯🇵",
};
const RATES_REFRESH_MS = 30 * 60 * 1000; // 30 minutes

type ExchangeRates = {
  fetchedAt: string;
  rates: Record<string, number>;
  prevClose: Record<string, number>;
};

type OfficeHourRow = { label: string; hours: string };
type PromoBannerRow = { contentId: string; filePath: string; name: string };

const DEFAULT_OFFICE_HOURS: OfficeHourRow[] = [
  { label: "Senin – Jumat", hours: "08.00 – 15.00" },
  { label: "Sabtu", hours: "08.00 – 12.00" },
];

const BANNER_ROTATE_MS = 8000;
const STOCKS_POLL_MS = 5000;
const STOCKS_PAGE_SIZE = 5;
const STOCKS_ROTATE_MS = 5000;

type StockQuote = {
  symbol: string;
  label: string;
  price: number;
  change: number;
  changePercent: number;
  currency: "IDR" | "USD";
};

type StockQuotes = {
  fetchedAt: string;
  quotes: StockQuote[];
};

function formatTimeParts(date: Date): { hh: string; mm: string } {
  return {
    hh: String(date.getHours()).padStart(2, "0"),
    mm: String(date.getMinutes()).padStart(2, "0"),
  };
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(
    value,
  );
}

function formatStockPrice(value: number): string {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(
    value,
  );
}

export default function SidebarZone(): React.ReactElement {
  const [now, setNow] = useState<Date | null>(null);
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [officeHours, setOfficeHours] =
    useState<OfficeHourRow[]>(DEFAULT_OFFICE_HOURS);
  const [promoBanners, setPromoBanners] = useState<PromoBannerRow[]>([]);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [stocks, setStocks] = useState<StockQuotes | null>(null);
  const [stockPage, setStockPage] = useState(0);
  const [stockVisible, setStockVisible] = useState(true);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function loadSettings(): Promise<void> {
      try {
        const res = await fetch("/api/settings", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();

        if (data.officeHours) {
          const parsed = JSON.parse(data.officeHours);
          if (Array.isArray(parsed) && parsed.length > 0)
            setOfficeHours(parsed);
        }
        if (data.promoBanners) {
          const parsed = JSON.parse(data.promoBanners);
          if (Array.isArray(parsed)) setPromoBanners(parsed);
        }
      } catch {
        // keep showing last known settings until next successful fetch
      }
    }

    loadSettings();
    const interval = setInterval(loadSettings, RATES_REFRESH_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (promoBanners.length < 2) return;
    const interval = setInterval(() => {
      setBannerIndex((i) => (i + 1) % promoBanners.length);
    }, BANNER_ROTATE_MS);
    return () => clearInterval(interval);
  }, [promoBanners.length]);

  useEffect(() => {
    async function loadRates(): Promise<void> {
      try {
        const res = await fetch("/api/exchange-rates", { cache: "no-store" });
        if (!res.ok) return;
        setRates(await res.json());
      } catch {
        // keep showing last known rates until next successful fetch
      }
    }

    loadRates();
    const interval = setInterval(loadRates, RATES_REFRESH_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function loadStocks(): Promise<void> {
      try {
        const res = await fetch("/api/stocks", { cache: "no-store" });
        if (!res.ok) return;
        setStocks(await res.json());
      } catch {
        // keep showing last known quotes until next successful fetch
      }
    }

    loadStocks();
    const interval = setInterval(loadStocks, STOCKS_POLL_MS);
    return () => clearInterval(interval);
  }, []);

  const totalStockPages = stocks ? Math.ceil(stocks.quotes.length / STOCKS_PAGE_SIZE) : 0;

  useEffect(() => {
    if (totalStockPages < 2) return;
    const interval = setInterval(() => {
      setStockVisible(false);
      setTimeout(() => {
        setStockPage((p) => (p + 1) % totalStockPages);
        setStockVisible(true);
      }, 300);
    }, STOCKS_ROTATE_MS);
    return () => clearInterval(interval);
  }, [totalStockPages]);

  return (
    <div className="player-sidebar">
      <div className="player-clock">
        <div className="player-clock-time">
          {now ? (
            <>
              {formatTimeParts(now).hh}
              <span className="clock-colon">:</span>
              {formatTimeParts(now).mm}
            </>
          ) : (
            "--:--"
          )}
        </div>
        <div className="player-clock-date">{now ? formatDate(now) : ""}</div>
      </div>
      <div className="player-info-box">
        <div className="player-info-title">Jam layanan</div>
        {officeHours.map((row, i) => (
          <div className="player-info-row" key={i}>
            <span>{row.label}</span>
            <span className="player-info-val">{row.hours}</span>
          </div>
        ))}
      </div>
      {rates && (
        <div className="player-info-box">
          <div className="player-info-title">Kurs mata uang</div>
          {Object.entries(rates.rates).map(([currency, value]) => {
            const prev = rates.prevClose[currency];
            const hasChange = typeof prev === "number" && prev > 0;
            const multiplier = currency === "JPY" ? 100 : 1;
            const diff = hasChange ? (value - prev) * multiplier : 0;
            return (
              <div className="player-info-row" key={currency}>
                <span>
                  {CURRENCY_FLAG[currency] ?? ""} {CURRENCY_LABEL[currency] ?? currency}
                </span>
                <span
                  className="player-info-val"
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  Rp {formatRupiah(value * multiplier)}
                  {hasChange && Math.abs(diff) >= 1 && (
                    <span
                      style={{
                        color: diff >= 0 ? "#22C55E" : "#EF4444",
                        fontWeight: 700,
                        fontSize: 10,
                      }}
                    >
                      {diff >= 0 ? "▲" : "▼"} Rp {formatRupiah(Math.abs(diff))}
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}
      {stocks && (
        <div className="player-info-box">
          <div className="player-info-title">Saham terkini</div>
          <div style={{ opacity: stockVisible ? 1 : 0, transition: "opacity 300ms ease" }}>
            {stocks.quotes
              .slice(stockPage * STOCKS_PAGE_SIZE, stockPage * STOCKS_PAGE_SIZE + STOCKS_PAGE_SIZE)
              .map((q) => (
                <div className="player-info-row" key={q.symbol}>
                  <span>{q.label}</span>
                  <span
                    className="player-info-val"
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    {q.currency === "IDR" ? "Rp " : "$"}
                    {formatStockPrice(q.price)}
                    <span
                      style={{
                        color: q.change >= 0 ? "#22C55E" : "#EF4444",
                        fontWeight: 700,
                        fontSize: 10,
                      }}
                    >
                      {q.change >= 0 ? "▲" : "▼"}{" "}
                      {Math.abs(q.changePercent).toFixed(2)}%
                    </span>
                  </span>
                </div>
              ))}
          </div>
          {totalStockPages > 1 && (
            <div style={{ display: "flex", gap: 4, marginTop: 8, justifyContent: "center" }}>
              {Array.from({ length: totalStockPages }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: i === stockPage ? "#3B82F6" : "rgba(255,255,255,0.3)",
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
      {promoBanners.length > 0 && (
        <div
          style={{
            marginTop: "auto",
            position: "relative",
            width: "100%",
            aspectRatio: "16 / 10",
            borderRadius: "var(--radius-md)",
            overflow: "hidden",
            border: "1px solid #1E2D45",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={promoBanners[bannerIndex % promoBanners.length].contentId}
            src={promoBanners[bannerIndex % promoBanners.length].filePath}
            alt={promoBanners[bannerIndex % promoBanners.length].name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          {promoBanners.length > 1 && (
            <div
              style={{
                position: "absolute",
                bottom: 8,
                left: 0,
                right: 0,
                display: "flex",
                justifyContent: "center",
                gap: 4,
              }}
            >
              {promoBanners.map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background:
                      i === bannerIndex % promoBanners.length
                        ? "#3B82F6"
                        : "rgba(255,255,255,0.4)",
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
