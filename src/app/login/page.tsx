import Link from "next/link";
import { signIn } from "@/app/actions/auth";

export const metadata = { title: "Ingresar — CornerMaster" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string; error?: string }>;
}) {
  const { redirectTo, error } = await searchParams;

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12 bg-slate-50">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600">
            CornerMaster
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            Ingresar a tu cuenta
          </h1>
        </div>

        <form action={signIn} className="mt-8 space-y-4">
          {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
              placeholder="tu@empresa.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">
              Email o contraseña incorrectos
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition"
          >
            Ingresar
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          <Link href="/" className="hover:text-slate-700">← Volver al inicio</Link>
        </p>
      </div>
    </main>
  );
}
