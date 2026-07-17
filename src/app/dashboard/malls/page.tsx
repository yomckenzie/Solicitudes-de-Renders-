import { PageHeader } from "@/components/PageHeader";
import { createMall, createTienda } from "@/app/actions/admin";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Malls y tiendas — CornerMaster" };

export default async function MallsPage() {
  const supabase = await createClient();
  const [{ data: malls }, { data: tiendas }] = await Promise.all([
    supabase.from("malls").select("id, nombre, ciudad").order("nombre"),
    supabase.from("tiendas").select("id, mall_id, nombre").order("nombre"),
  ]);

  return (
    <>
      <PageHeader
        title="Malls y tiendas"
        description="Administrá la red de malls y las tiendas que alojan corners."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Malls */}
        <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200/60">
          <h2 className="text-base font-semibold text-slate-900 mb-3">Malls ({malls?.length ?? 0})</h2>

          <form action={createMall} className="grid grid-cols-3 gap-2 mb-4">
            <input name="id" required placeholder="MALL-009" className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none" />
            <input name="nombre" required placeholder="Nombre" className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none" />
            <input name="ciudad" required placeholder="Ciudad" className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none" />
            <button type="submit" className="col-span-3 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              + Agregar mall
            </button>
          </form>

          <ul className="divide-y divide-slate-100">
            {(malls ?? []).map((m) => (
              <li key={m.id} className="py-2 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">{m.nombre}</p>
                  <p className="text-xs text-slate-500">{m.ciudad}</p>
                </div>
                <code className="text-xs text-slate-400">{m.id}</code>
              </li>
            ))}
            {(!malls || malls.length === 0) && <li className="py-3 text-center text-sm text-slate-500">Sin malls</li>}
          </ul>
        </section>

        {/* Tiendas */}
        <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200/60">
          <h2 className="text-base font-semibold text-slate-900 mb-3">Tiendas ({tiendas?.length ?? 0})</h2>

          <form action={createTienda} className="grid grid-cols-3 gap-2 mb-4">
            <input name="id" required placeholder="TIEN-014" className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none" />
            <select name="mall_id" required className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none">
              <option value="">Mall</option>
              {(malls ?? []).map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
            <input name="nombre" required placeholder="Nombre tienda" className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none" />
            <button type="submit" className="col-span-3 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              + Agregar tienda
            </button>
          </form>

          <ul className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {(tiendas ?? []).map((t) => (
              <li key={t.id} className="py-2 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">{t.nombre}</p>
                  <p className="text-xs text-slate-500">{(malls ?? []).find((m) => m.id === t.mall_id)?.nombre ?? t.mall_id}</p>
                </div>
                <code className="text-xs text-slate-400">{t.id}</code>
              </li>
            ))}
            {(!tiendas || tiendas.length === 0) && <li className="py-3 text-center text-sm text-slate-500">Sin tiendas</li>}
          </ul>
        </section>
      </div>
    </>
  );
}
