import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { CornerFilters } from "@/components/CornerFilters";
import { StatusBadge } from "@/components/StatusBadge";
import { createClient } from "@/lib/supabase/server";
import { formatDate, daysSince } from "@/lib/utils";
import type { Estado } from "@/lib/constants";

export const metadata = { title: "Corners — CornerMaster" };

type SP = { q?: string; mall?: string; marca?: string; cat?: string; estado?: string };

export default async function CornersListPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  // Cargar malls para los filtros
  const { data: malls } = await supabase
    .from("malls").select("id, nombre").order("nombre");

  // Query de corners con filtros
  let query = supabase
    .from("corners")
    .select(`id, corner_id, mall_id, tienda_id, marca, categoria, estado, fecha_ultima_actualizacion, responsable, notas`)
    .order("fecha_ultima_actualizacion", { ascending: false });

  if (sp.mall)   query = query.eq("mall_id", sp.mall);
  if (sp.marca)  query = query.eq("marca", sp.marca);
  if (sp.cat)    query = query.eq("categoria", sp.cat);
  if (sp.estado) query = query.eq("estado", sp.estado);
  if (sp.q) {
    query = query.or(`corner_id.ilike.%${sp.q}%,responsable.ilike.%${sp.q}%,notas.ilike.%${sp.q}%`);
  }

  const [{ data: rawCorners }, { data: allMalls }, { data: allTiendas }] = await Promise.all([
    query,
    supabase.from("malls").select("id, nombre"),
    supabase.from("tiendas").select("id, nombre"),
  ]);

  const mallMap = new Map((allMalls ?? []).map((m) => [m.id, m.nombre]));
  const tiendaMap = new Map((allTiendas ?? []).map((t) => [t.id, t.nombre]));
  const corners = (rawCorners ?? []).map((c) => ({
    ...c,
    mall_nombre: mallMap.get(c.mall_id) ?? "—",
    tienda_nombre: tiendaMap.get(c.tienda_id) ?? "—",
  }));

  return (
    <>
      <PageHeader
        title="Corners"
        description={`${corners?.length ?? 0} resultado${(corners?.length ?? 0) === 1 ? "" : "s"}`}
        action={
          <Link
            href="/dashboard/corners/new"
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition"
          >
            <Plus className="h-4 w-4" /> Nuevo corner
          </Link>
        }
      />

      <div className="mb-4">
        <CornerFilters malls={malls ?? []} />
      </div>

      <div className="rounded-2xl bg-white ring-1 ring-slate-200/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Marca</th>
                <th className="px-4 py-3">Mall</th>
                <th className="px-4 py-3">Tienda</th>
                <th className="px-4 py-3">Cat.</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Última act.</th>
                <th className="px-4 py-3">Responsable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(corners ?? []).map((c) => {
                const ds = daysSince(c.fecha_ultima_actualizacion);
                return (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/corners/${c.corner_id}`} className="font-mono text-xs font-semibold text-emerald-700 hover:text-emerald-800">
                        {c.corner_id}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">{c.marca}</td>
                    <td className="px-4 py-3 text-slate-700">{c.mall_nombre}</td>
                    <td className="px-4 py-3 text-slate-700">{c.tienda_nombre}</td>
                    <td className="px-4 py-3 text-slate-700">{c.categoria}</td>
                    <td className="px-4 py-3"><StatusBadge estado={c.estado as Estado} /></td>
                    <td className="px-4 py-3 text-slate-600">
                      <div>{formatDate(c.fecha_ultima_actualizacion)}</div>
                      <div className="text-[10px] text-slate-500">
                        {ds === null ? "—" : ds === 0 ? "hoy" : `hace ${ds}d`}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{c.responsable ?? "—"}</td>
                  </tr>
                );
              })}
              {(!corners || corners.length === 0) && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                    No se encontraron corners con esos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
