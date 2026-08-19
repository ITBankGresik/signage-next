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
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ background: "var(--surface-page)" }}
    >
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
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

        <form onSubmit={handleSubmit} className="card">
          <div className="card-body">
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email
              </label>
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
            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Password
              </label>
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

            {error && <p className="form-error mb-4">{error}</p>}

            <button type="submit" className="btn btn-primary w-full justify-center" disabled={loading}>
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </div>
        </form>
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
