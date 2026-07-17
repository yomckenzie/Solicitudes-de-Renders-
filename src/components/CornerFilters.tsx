"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ESTADOS, MARCAS, CATEGORIAS, ESTADO_META } from "@/lib/constants";
import { Search, X } from "lucide-react";

export function CornerFilters({
  malls,
}: {
  malls: { id: string; nombre: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  const current = {
    q:        search.get("q") ?? "",
    mall:     search.get("mall") ?? "",
    marca:    search.get("marca") ?? "",
    cat:      search.get("cat") ?? "",
    estado:   search.get("estado") ?? "",
  };

  const set = (key: string, value: string) => {
    const params = new URLSearchParams(search);
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  };

  const reset = () => router.push(pathname);

  const hasFilters = Object.values(current).some((v) => v !== "");

  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200/60 space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="search"
          placeholder="Buscar por ID, responsable o nota..."
          defaultValue={current.q}
          onChange={(e) => set("q", e.target.value)}
          className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <select
          value={current.mall}
          onChange={(e) => set("mall", e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
        >
          <option value="">Todos los malls</option>
          {malls.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
        </select>

        <select
          value={current.marca}
          onChange={(e) => set("marca", e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
        >
          <option value="">Todas las marcas</option>
          {MARCAS.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>

        <select
          value={current.cat}
          onChange={(e) => set("cat", e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
        >
          <option value="">Todas las categorías</option>
          {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <select
          value={current.estado}
          onChange={(e) => set("estado", e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
        >
          <option value="">Todos los estados</option>
          {ESTADOS.map((e) => <option key={e} value={e}>{ESTADO_META[e].label}</option>)}
        </select>
      </div>

      {hasFilters && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-slate-500">Filtros activos</p>
          <button
            onClick={reset}
            className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900"
          >
            <X className="h-3 w-3" /> Limpiar
          </button>
        </div>
      )}
    </div>
  );
}
