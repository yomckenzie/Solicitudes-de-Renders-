import { Boxes, MapPin, Building2 } from "lucide-react";
import { KpiCard } from "@/components/KpiCard";
import { StatusDonut } from "@/components/StatusDonut";
import { StatusBadge } from "@/components/StatusBadge";
import { PageHeader } from "@/components/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { type Estado } from "@/lib/constants";
import { daysSince } from "@/lib/utils";
import Link from "next/link";

export const metadata = { title: "Resumen — CornerMaster" };

export default async function DashboardHome() {
  const supabase = await createClient();

  // Cargar todo en paralelo
  const [
    { count: totalCorners },
    { count: totalMalls },
    { count: totalTiendas },
    { data: recentRaw },
    { data: allMalls },
    { data: allTiendas },
  ] = await Promise.all([
    supabase.from("corners").select("id", { count: "exact", head: true }),
    supabase.from("malls").select("id", { count: "exact", head: true }),
    supabase.from("tiendas").select("id", { count: "exact", head: true }),
    supabase
      .from("corners")
      .select("id, corner_id, mall_id, tienda_id, marca, estado, fecha_ultima_actualizacion")
      .order("fecha_ultima_actualizacion", { ascending: false })
      .limit(6),
    supabase.from("malls").select("id, nombre"),
    supabase.from("tiendas").select("id, nombre"),
  ]);

  const mallMap = new Map((allMalls ?? []).map((m) => [m.id, m.nombre]));
  const tiendaMap = new Map((allTiendas ?? []).map((t) => [t.id, t.nombre]));
  const corners = (recentRaw ?? []).map((c) => ({
    ...c,
    mall_nombre: mallMap.get(c.mall_id) ?? "—",
    tienda_nombre: tiendaMap.get(c.tienda_id) ?? "—",
  }));

  // Conteos por estado
  const { data: estadoRows } = await supabase
    .from("corners")
    .select("estado");

  const counts: Record<Estado, number> = {
    actualizado: 0, pendiente: 0, requiere_inversion: 0,
    sin_mobiliario: 0, en_mantenimiento: 0,
  };
  (estadoRows ?? []).forEach((r) => { counts[r.estado as Estado] = (counts[r.estado as Estado] ?? 0) + 1; });

  const pctActualizado = (totalCorners ?? 0) > 0
    ? Math.round((counts.actualizado / (totalCorners ?? 1)) * 100)
    : 0;

  return (
    <>
      <PageHeader
        title="Resumen"
        description={`${pctActualizado}% de tus corners están actualizados`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Corners"  value={totalCorners ?? 0}  icon={Boxes}     accent="emerald" hint="Registrados en el sistema" />
        <KpiCard label="Malls"          value={totalMalls ?? 0}    icon={MapPin}    accent="sky" />
        <KpiCard label="Tiendas"        value={totalTiendas ?? 0}  icon={Building2} accent="slate" />
        <KpiCard
          label="% Actualizado"
          value={`${pctActualizado}%`}
          icon={Boxes}
          accent={pctActualizado >= 70 ? "emerald" : pctActualizado >= 40 ? "amber" : "rose"}
          hint={`${counts.actualizado} de ${totalCorners ?? 0}`}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/60">
          <h2 className="text-base font-semibold text-slate-900">Distribución por estado</h2>
          <p className="text-xs text-slate-500">Vista rápida del semáforo</p>
          <div className="mt-4">
            <StatusDonut counts={counts} />
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/60">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Últimos actualizados</h2>
              <p className="text-xs text-slate-500">Actividad reciente del equipo</p>
            </div>
            <Link href="/dashboard/corners" className="text-sm font-medium text-emerald-700 hover:text-emerald-800">
              Ver todos →
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-slate-100">
            {(corners ?? []).map((c) => {
              const ds = daysSince(c.fecha_ultima_actualizacion);
              return (
                <li key={c.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {c.corner_id} · {c.marca}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {c.mall_nombre} · {c.tienda_nombre}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge estado={c.estado as Estado} />
                    <span className="text-[10px] text-slate-500">
                      {ds === null ? "—" : ds === 0 ? "hoy" : `hace ${ds}d`}
                    </span>
                  </div>
                </li>
              );
            })}
            {(!corners || corners.length === 0) && (
              <li className="py-6 text-center text-sm text-slate-500">Sin actividad reciente</li>
            )}
          </ul>
        </div>
      </div>
    </>
  );
}
