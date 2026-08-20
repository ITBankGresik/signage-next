"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (!res || res.error) {
      setError("Email atau password salah");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen">
      <div
        className="relative hidden flex-col justify-between overflow-hidden p-12 lg:flex lg:w-[45%]"
        style={{ background: "linear-gradient(160deg, var(--blue-900), var(--blue-950))" }}
      >
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full"
          style={{ background: "rgba(255,255,255,0.04)" }}
        />
        <div
          className="pointer-events-none absolute -right-10 bottom-16 h-48 w-48 rounded-full"
          style={{ background: "rgba(255,255,255,0.04)" }}
        />

        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{ background: "rgba(255,255,255,0.1)" }}
          >
            <i className="ti ti-device-tv" style={{ color: "white", fontSize: 20 }} />
          </div>
          <span className="text-sm font-semibold text-white">Signage BG</span>
        </div>

        <div className="relative">
          <h1
            className="mb-4 text-4xl font-bold leading-tight text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Kelola konten
            <br />
            digital signage
            <br />
            dengan mudah
          </h1>
          <p className="max-w-sm text-sm" style={{ color: "var(--blue-200)" }}>
            Panel admin terpusat untuk mengatur playlist, jadwal tayang, dan layar
            BPR Bank Gresik.
          </p>
        </div>

        <p className="text-xs" style={{ color: "var(--blue-300)" }}>
          &copy; {new Date().getFullYear()} BPR Bank Gresik
        </p>
      </div>

      <div
        className="flex flex-1 items-center justify-center p-6"
        style={{ background: "var(--surface-page)" }}
      >
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center gap-3 lg:hidden">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-lg"
              style={{ background: "var(--blue-700)" }}
            >
              <i className="ti ti-device-tv" style={{ color: "white", fontSize: 24 }} />
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                Signage BPR Bank Gresik
              </div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                Admin Panel
              </div>
            </div>
          </div>

          <div className="mb-6 hidden lg:block">
            <h2
              className="text-xl font-bold"
              style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
            >
              Masuk ke Admin Panel
            </h2>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              Masukkan kredensial untuk melanjutkan.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-xl p-6"
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-md)",
            }}
          >
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email
              </label>
              <div className="input-with-icon">
                <i className="ti ti-mail input-icon" />
                <input
                  id="email"
                  type="email"
                  className="input"
                  placeholder="admin@bankgresik.co.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Password
              </label>
              <div className="input-with-icon">
                <i className="ti ti-lock input-icon" />
                <input
                  id="password"
                  type="password"
                  className="input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {error && <p className="form-error mb-4">{error}</p>}

            <button type="submit" className="btn btn-primary w-full justify-center" disabled={loading}>
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs lg:hidden" style={{ color: "var(--text-disabled)" }}>
            &copy; {new Date().getFullYear()} BPR Bank Gresik
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
