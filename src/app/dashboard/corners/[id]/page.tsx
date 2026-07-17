import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, MapPin, Store, Tag, Calendar, User } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { CornerForm } from "@/components/CornerForm";
import { PhotoGallery } from "@/components/PhotoGallery";
import { QuickStatusButtons } from "@/components/QuickStatusButtons";
import { StatusBadge } from "@/components/StatusBadge";
import { createClient } from "@/lib/supabase/server";
import { formatDate, daysSince } from "@/lib/utils";
import type { Estado } from "@/lib/constants";

export const metadata = { title: "Detalle del corner — CornerMaster" };

export default async function CornerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Cargar el corner primero: el param `id` es el corner_id legible
  // ("CRN-XXXXXX") y `corner_audit.corner_id` es UUID, por lo que no se
  // puede consultar el historial hasta tener `corner.id`.
  const { data: corner } = await supabase
    .from("corners")
    .select(`id, corner_id, mall_id, tienda_id, marca, categoria, estado, fecha_ultima_actualizacion, responsable, notas, created_at, updated_at`)
    .eq("corner_id", id)
    .single();

  if (!corner) notFound();

  const [{ data: malls }, { data: tiendas }, { data: audit }, { data: fotos }] = await Promise.all([
    supabase.from("malls").select("id, nombre, ciudad").order("nombre"),
    supabase.from("tiendas").select("id, nombre, mall_id").order("nombre"),
    supabase
      .from("corner_audit")
      .select("id, accion, estado_anterior, estado_nuevo, notas, created_at, corner_id")
      .eq("corner_id", corner.id) // UUID, no el corner_id legible del param
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("corner_fotos")
      .select("id, url, thumbnail_url, fecha")
      .eq("corner_id", corner.id)
      .order("fecha", { ascending: false }),
  ]);

  const mallObj = (malls ?? []).find((m) => m.id === corner.mall_id);
  const tiendaObj = (tiendas ?? []).find((t) => t.id === corner.tienda_id);

  const estado = corner.estado as Estado;
  const ds = daysSince(corner.fecha_ultima_actualizacion);

  return (
    <>
      <Link
        href="/dashboard/corners"
        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-4"
      >
        <ChevronLeft className="h-4 w-4" /> Volver a corners
      </Link>

      <PageHeader
        title={`${corner.corner_id} · ${corner.marca}`}
        description={
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
            <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {mallObj?.nombre} · {mallObj?.ciudad}</span>
            <span className="inline-flex items-center gap-1"><Store className="h-3.5 w-3.5" /> {tiendaObj?.nombre}</span>
            <span className="inline-flex items-center gap-1"><Tag className="h-3.5 w-3.5" /> {corner.categoria}</span>
          </div>
        }
        action={<StatusBadge estado={estado} />}
      />

      {/* Acciones rápidas */}
      <div className="mb-6 rounded-2xl bg-white p-4 ring-1 ring-slate-200/60">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
          Cambio rápido de estado
        </p>
        <QuickStatusButtons cornerId={corner.corner_id} current={estado} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {/* Galería */}
          <PhotoGallery cornerRowId={corner.id} fotos={fotos ?? []} />

          {/* Form edición */}
          <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200/60">
            <h3 className="text-base font-semibold text-slate-900 mb-3">Editar datos</h3>
            <CornerForm
              malls={malls ?? []}
              tiendas={tiendas ?? []}
              mode="edit"
              initial={{
                corner_id: corner.corner_id,
                mall_id: corner.mall_id,
                tienda_id: corner.tienda_id,
                marca: corner.marca,
                categoria: corner.categoria,
                estado: estado,
                responsable: corner.responsable,
                notas: corner.notas,
              }}
            />
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200/60">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Información</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500 inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Última act.</dt>
                <dd className="font-medium text-slate-900 text-right">
                  {formatDate(corner.fecha_ultima_actualizacion)}
                  <div className="text-[10px] text-slate-500">
                    {ds === null ? "—" : ds === 0 ? "hoy" : `hace ${ds}d`}
                  </div>
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500 inline-flex items-center gap-1"><User className="h-3.5 w-3.5" /> Responsable</dt>
                <dd className="font-medium text-slate-900 text-right">{corner.responsable ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Creado</dt>
                <dd className="font-medium text-slate-900 text-right">{formatDate(corner.created_at)}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200/60">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Historial</h3>
            <ol className="space-y-3 text-sm">
              {(audit ?? []).slice(0, 10).map((a) => (
                <li key={a.id} className="border-l-2 border-slate-200 pl-3">
                  <p className="text-slate-700">{a.accion}{a.estado_anterior && a.estado_nuevo ? `: ${a.estado_anterior} → ${a.estado_nuevo}` : ""}</p>
                  <p className="text-xs text-slate-500">{formatDate(a.created_at)}</p>
                </li>
              ))}
              {(!audit || audit.length === 0) && <li className="text-slate-500">Sin movimientos</li>}
            </ol>
          </div>
        </aside>
      </div>
    </>
  );
}
