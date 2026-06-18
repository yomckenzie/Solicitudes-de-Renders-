"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, FileText, MapPin, Calendar, User, CheckCircle,
  AlertCircle, Clock, Package, CreditCard, Wrench, Image as ImageIcon,
  ClipboardList, Eye, ChevronRight, ExternalLink,
} from "lucide-react";
import { ESTADO_SOLICITUD_LABELS, ESTADO_SOLICITUD_COLORS, type EstadoSolicitud } from "@/types";

const ESTADOS_FLUJO: EstadoSolicitud[] = [
  "BORRADOR","APROBADA","EN_MEDICION","EN_DISENIO",
  "APROBACION_MERCADEO","APROBACION_CLIENTE",
  "ABONO_PENDIENTE","EN_INSTALACION","COMPLETADA",
];

function fmt(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-PA");
}

function EstadoBadge({ estado }: { estado: string }) {
  const s = estado as EstadoSolicitud;
  const color = ESTADO_SOLICITUD_COLORS[s] ?? "bg-gray-100 text-gray-600";
  const label = ESTADO_SOLICITUD_LABELS[s] ?? estado;
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>{label}</span>;
}

export default function SolicitudDetallePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [avanzando, setAvanzando] = useState(false);

  useEffect(() => {
    fetch(`/api/solicitudes/${id}/detalle`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const avanzarEstado = async () => {
    if (!data) return;
    const sol = data.solicitud as Record<string, unknown>;
    const idx = ESTADOS_FLUJO.indexOf(sol.estado as EstadoSolicitud);
    if (idx < 0 || idx >= ESTADOS_FLUJO.length - 1) return;
    const next = ESTADOS_FLUJO[idx + 1];
    setAvanzando(true);
    await fetch(`/api/solicitudes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: next }),
    });
    const r = await fetch(`/api/solicitudes/${id}/detalle`);
    setData(await r.json());
    setAvanzando(false);
  };

  if (loading) return <div className="p-8 text-gray-500">Cargando...</div>;
  if (!data?.solicitud) return (
    <div className="p-8 text-center text-gray-500">
      Solicitud no encontrada.{" "}
      <button onClick={() => router.back()} className="text-blue-600 hover:underline">Volver</button>
    </div>
  );

  const sol = data.solicitud as Record<string, unknown>;
  const pdv = sol.puntos_de_venta as Record<string, unknown> | null;
  const usuario = sol.usuarios as Record<string, unknown> | null;
  const tareas = (data.tareas as unknown[]) ?? [];
  const renders = (data.renders as unknown[]) ?? [];
  const cotizaciones = (data.cotizaciones as unknown[]) ?? [];
  const pagos = (data.pagos as unknown[]) ?? [];
  const instalacion = data.instalacion as Record<string, unknown> | null;
  const visitas = (data.visitas as unknown[]) ?? [];

  const estadoIdx = ESTADOS_FLUJO.indexOf(sol.estado as EstadoSolicitud);
  const progreso = estadoIdx >= 0 ? Math.round(((estadoIdx + 1) / ESTADOS_FLUJO.length) * 100) : 0;
  const puedeAvanzar = estadoIdx >= 0 && estadoIdx < ESTADOS_FLUJO.length - 1;

  const totalPagado = pagos.reduce<number>((s, p) => s + (Number((p as Record<string,unknown>).monto) || 0), 0);

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900">Solicitud</h1>
            <span className="font-mono text-sm text-gray-500">#{(sol.id as string).slice(0, 8)}</span>
            <EstadoBadge estado={sol.estado as string} />
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              sol.tipo === "disenio" ? "bg-blue-50 text-blue-700" :
              sol.tipo === "cotizacion" ? "bg-yellow-50 text-yellow-700" :
              "bg-red-50 text-red-700"
            }`}>
              {sol.tipo === "disenio" ? "Diseño" : sol.tipo === "cotizacion" ? "Cotización" : "Retiro"}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            Creada el {fmt(sol.createdAt as string)} · {sol.marca as string}
          </p>
        </div>
        {puedeAvanzar && (
          <button
            onClick={avanzarEstado}
            disabled={avanzando}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <ChevronRight size={15} />
            {avanzando ? "Avanzando..." : `→ ${ESTADO_SOLICITUD_LABELS[ESTADOS_FLUJO[estadoIdx + 1]]}`}
          </button>
        )}
      </div>

      {/* Barra de progreso del flujo */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray-700">Progreso del Flujo</p>
          <span className="text-xs text-gray-500">{estadoIdx + 1} / {ESTADOS_FLUJO.length} pasos</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
          <div
            className={`h-full rounded-full transition-all duration-500 ${progreso === 100 ? "bg-green-500" : "bg-blue-500"}`}
            style={{ width: `${progreso}%` }}
          />
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {ESTADOS_FLUJO.map((e, i) => (
            <span
              key={e}
              className={`shrink-0 text-[10px] px-2 py-1 rounded-full font-medium ${
                i < estadoIdx ? "bg-green-100 text-green-700" :
                i === estadoIdx ? "bg-blue-600 text-white" :
                "bg-gray-100 text-gray-400"
              }`}
            >
              {ESTADO_SOLICITUD_LABELS[e]}
            </span>
          ))}
        </div>
      </div>

      {/* PDV + Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* PDV */}
        {pdv && (
          <Link
            href={`/dashboard/pdv/${sol.pdvId}`}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all group col-span-1"
          >
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={16} className="text-blue-500" />
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Punto de Venta</p>
              <ExternalLink size={11} className="ml-auto text-gray-300 group-hover:text-blue-500" />
            </div>
            <p className="font-bold text-gray-900">PDV-{pdv.numeroPdv as number}</p>
            <p className="text-sm text-gray-700">{pdv.cadena as string}</p>
            <p className="text-xs text-gray-500 mt-1">{pdv.mallZona as string} · {pdv.provincia as string}</p>
          </Link>
        )}

        {/* Responsable */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <User size={16} className="text-purple-500" />
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Responsable</p>
          </div>
          <p className="font-bold text-gray-900">{usuario?.nombre as string ?? "—"}</p>
          <p className="text-xs text-gray-500 mt-1">Rol: {usuario?.rol as string ?? "—"}</p>
          {!!sol.notas && <p className="text-xs text-gray-500 mt-2 italic">&quot;{sol.notas as string}&quot;</p>}
        </div>

        {/* Financiero */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard size={16} className="text-green-500" />
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Financiero</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            ${totalPagado.toLocaleString("es-PA", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-500">Total pagado · {pagos.length} pago(s)</p>
          {cotizaciones.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              Cotizaciones: {cotizaciones.length}
            </p>
          )}
        </div>
      </div>

      {/* Grid de módulos enlazados */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Tareas */}
        <SectionCard
          icon={<ClipboardList size={16} className="text-indigo-500" />}
          title="Tareas"
          count={tareas.length}
          linkTo="/dashboard/tareas"
          linkLabel="Ver todas las tareas"
          empty="Sin tareas asignadas"
        >
          {tareas.slice(0, 3).map((t) => {
            const tarea = t as Record<string, unknown>;
            return (
              <div key={tarea.id as string} className="flex items-start justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">{tarea.titulo as string}</p>
                  <p className="text-xs text-gray-500">→ {tarea.asignadaA as string}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                  tarea.estado === "Completada" ? "bg-green-100 text-green-700" :
                  tarea.estado === "En Progreso" ? "bg-blue-100 text-blue-700" :
                  "bg-gray-100 text-gray-600"
                }`}>{tarea.estado as string}</span>
              </div>
            );
          })}
        </SectionCard>

        {/* Renders */}
        <SectionCard
          icon={<ImageIcon size={16} className="text-pink-500" />}
          title="Renders"
          count={renders.length}
          linkTo="/dashboard/renders"
          linkLabel="Ver todos los renders"
          empty="Sin renders subidos"
        >
          {renders.slice(0, 3).map((r) => {
            const render = r as Record<string, unknown>;
            const aprobMercadeo = render.aprobadoMercadeo as boolean;
            const aprobCliente = render.aprobadoCliente as boolean;
            return (
              <div key={render.id as string} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    <a href={render.archivoUrl as string} target="_blank" rel="noopener noreferrer"
                      className="hover:text-blue-600 flex items-center gap-1">
                      Versión {render.version as number}
                      <ExternalLink size={10} />
                    </a>
                  </p>
                  <p className="text-xs text-gray-500">por {render.subidoPor as string}</p>
                </div>
                <div className="flex gap-1">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${aprobMercadeo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {aprobMercadeo ? "✓ Mercadeo" : "⏳ Mercadeo"}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${aprobCliente ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {aprobCliente ? "✓ Cliente" : "⏳ Cliente"}
                  </span>
                </div>
              </div>
            );
          })}
        </SectionCard>

        {/* Pagos */}
        <SectionCard
          icon={<CreditCard size={16} className="text-green-500" />}
          title="Pagos"
          count={pagos.length}
          linkTo="/dashboard/pagos"
          linkLabel="Ver todos los pagos"
          empty="Sin pagos registrados"
        >
          {pagos.slice(0, 3).map((p) => {
            const pago = p as Record<string, unknown>;
            return (
              <div key={pago.id as string} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-bold text-gray-800">
                    ${Number(pago.monto).toLocaleString("es-PA", { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-gray-500">{fmt(pago.fecha as string)} · por {pago.registradoPor as string}</p>
                </div>
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
                  {pago.porcentaje as number}%
                </span>
              </div>
            );
          })}
        </SectionCard>

        {/* Instalación */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Wrench size={16} className="text-orange-500" />
            <p className="text-sm font-semibold text-gray-800">Instalación</p>
            <Link href="/dashboard/instalaciones" className="ml-auto text-xs text-blue-500 hover:underline">
              Ver instalaciones →
            </Link>
          </div>
          {instalacion ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Fecha confirmada</span>
                <span className="font-medium">{fmt(instalacion.fechaConfirmada as string)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Visita realizada</span>
                <span className={`font-medium ${instalacion.visitaRealizada ? "text-green-600" : "text-gray-400"}`}>
                  {instalacion.visitaRealizada ? "✓ Sí" : "Pendiente"}
                </span>
              </div>
              {(instalacion.fechasPropuestas as string[] | null)?.length && (
                <div>
                  <p className="text-gray-500 text-xs mb-1">Fechas propuestas:</p>
                  {(instalacion.fechasPropuestas as string[]).map((f, i) => (
                    <p key={i} className="text-xs text-gray-600">• {fmt(f)}</p>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-xs text-gray-400">Sin instalación programada</p>
              <Link href="/dashboard/instalaciones" className="text-xs text-blue-500 hover:underline mt-1 inline-block">
                Programar instalación →
              </Link>
            </div>
          )}
        </div>

        {/* Cotizaciones */}
        <SectionCard
          icon={<FileText size={16} className="text-yellow-600" />}
          title="Cotizaciones"
          count={cotizaciones.length}
          linkTo="/dashboard/cotizaciones"
          linkLabel="Ver cotizaciones"
          empty="Sin cotizaciones"
        >
          {cotizaciones.slice(0, 3).map((c) => {
            const cot = c as Record<string, unknown>;
            return (
              <div key={cot.id as string} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800 capitalize">{cot.tipo as string}</p>
                  <p className="text-xs text-gray-500">{fmt(cot.createdAt as string)}</p>
                </div>
                <span className="text-sm font-semibold text-gray-700">
                  ${Number(cot.precioMin).toLocaleString()} – ${Number(cot.precioMax).toLocaleString()}
                </span>
              </div>
            );
          })}
        </SectionCard>

        {/* Visitas al PDV */}
        <SectionCard
          icon={<Eye size={16} className="text-purple-500" />}
          title="Visitas al PDV"
          count={visitas.length}
          linkTo="/dashboard/visitas"
          linkLabel="Ver visitas"
          empty="Sin visitas registradas"
        >
          {visitas.slice(0, 3).map((v) => {
            const visita = v as Record<string, unknown>;
            const usuarios = visita.usuarios as Record<string, unknown> | null;
            return (
              <div key={visita.id as string} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">{fmt(visita.fecha as string)}</p>
                  <p className="text-xs text-gray-500">{usuarios?.nombre as string ?? "—"}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  visita.estadoEspacio === "Actualizado" ? "bg-green-100 text-green-700" :
                  visita.estadoEspacio === "Critico" ? "bg-red-100 text-red-700" :
                  visita.estadoEspacio === "Desactualizado" ? "bg-yellow-100 text-yellow-700" :
                  "bg-blue-100 text-blue-700"
                }`}>{visita.estadoEspacio as string}</span>
              </div>
            );
          })}
        </SectionCard>
      </div>
    </div>
  );
}

function SectionCard({
  icon, title, count, linkTo, linkLabel, empty, children,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  linkTo: string;
  linkLabel: string;
  empty: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <p className="text-sm font-semibold text-gray-800">{title}</p>
        {count > 0 && (
          <span className="ml-1 bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full font-medium">{count}</span>
        )}
        <Link href={linkTo} className="ml-auto text-xs text-blue-500 hover:underline">{linkLabel} →</Link>
      </div>
      {count === 0 ? (
        <p className="text-xs text-gray-400 text-center py-4">{empty}</p>
      ) : children}
    </div>
  );
}
