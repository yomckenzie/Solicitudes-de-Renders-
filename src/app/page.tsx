import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return (
    <main className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-2xl w-full text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600">
            CornerMaster
          </p>
          <h1 className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight text-slate-900">
            Gestión de corners, sin Excel
          </h1>
          <p className="mt-6 text-lg text-slate-600">
            Centralizá todos tus corners (JC, JCX, CK, JCB) en un solo lugar.
            Estados en tiempo real, fotos en alta resolución, y un dashboard
            que te dice exactamente qué necesita atención.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition"
            >
              Ingresar
            </Link>
          </div>
        </div>
      </div>
      <footer className="py-6 text-center text-xs text-slate-500">
        CornerMaster © {new Date().getFullYear()}
      </footer>
    </main>
  );
}
