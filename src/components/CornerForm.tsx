"use client";

import { useState, useTransition } from "react";
import { useRouter, unstable_rethrow } from "next/navigation";
import { toast } from "sonner";
import { CATEGORIAS, ESTADOS, MARCAS, type Categoria, type Estado, type Marca } from "@/lib/constants";
import { createCorner, updateCorner, deleteCorner } from "@/app/actions/corners";

interface CornerData {
  corner_id?: string;
  mall_id?: string;
  tienda_id?: string;
  marca?: Marca;
  categoria?: Categoria;
  estado?: Estado;
  responsable?: string | null;
  notas?: string | null;
}

export function CornerForm({
  malls,
  tiendas,
  mode,
  initial,
}: {
  malls: { id: string; nombre: string; ciudad: string }[];
  tiendas: { id: string; nombre: string; mall_id: string }[];
  mode: "create" | "edit";
  initial?: CornerData;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [mallId, setMallId] = useState(initial?.mall_id ?? "");
  const [tiendaId, setTiendaId] = useState(initial?.tienda_id ?? "");

  const tiendasDelMall = tiendas.filter((t) => t.mall_id === mallId);

  const submit = (formData: FormData) => {
    startTransition(async () => {
      try {
        if (mode === "create") {
          await createCorner(formData);
          // Si llegamos acá sin redirect, fue un fallo de la action
          toast.error("No se pudo crear el corner");
          router.push("/dashboard/corners");
        } else {
          await updateCorner(initial!.corner_id!, formData);
          toast.success("Cambios guardados");
          router.refresh();
        }
      } catch (err) {
        // unstable_rethrow re-lanza NEXT_REDIRECT/NEXT_NOT_FOUND para que Next.js los maneje
        unstable_rethrow(err);
        toast.error(err instanceof Error ? err.message : "Error desconocido");
      }
    });
  };

  const handleDelete = () => {
    if (!initial?.corner_id) return;
    if (!confirm("¿Eliminar este corner? Esta acción no se puede deshacer.")) return;
    startTransition(async () => {
      try {
        await deleteCorner(initial.corner_id!);
        // deleteCorner hace redirect() server-side
      } catch (err) {
        unstable_rethrow(err);
        toast.error(err instanceof Error ? err.message : "Error desconocido");
      }
    });
  };

  return (
    <form action={submit} className="space-y-4 rounded-2xl bg-white p-5 ring-1 ring-slate-200/60">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Mall</label>
          <select
            name="mall_id"
            required
            value={mallId}
            onChange={(e) => { setMallId(e.target.value); setTiendaId(""); }}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
          >
            <option value="">— Seleccionar —</option>
            {malls.map((m) => <option key={m.id} value={m.id}>{m.nombre} · {m.ciudad}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Tienda</label>
          <select
            name="tienda_id"
            required
            value={tiendaId}
            onChange={(e) => setTiendaId(e.target.value)}
            disabled={!mallId}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
          >
            <option value="">— Seleccionar —</option>
            {tiendasDelMall.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Marca</label>
          <select
            name="marca"
            required
            defaultValue={initial?.marca ?? "JC"}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
          >
            {MARCAS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Categoría</label>
          <select
            name="categoria"
            required
            defaultValue={initial?.categoria ?? "Casual"}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
          >
            {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Estado</label>
          <select
            name="estado"
            required
            defaultValue={initial?.estado ?? "pendiente"}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
          >
            {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Responsable</label>
          <input
            type="text"
            name="responsable"
            defaultValue={initial?.responsable ?? ""}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
            placeholder="Nombre del supervisor"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Notas</label>
        <textarea
          name="notas"
          rows={3}
          defaultValue={initial?.notas ?? ""}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
          placeholder="Observaciones, pendientes, recordatorios..."
        />
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        {mode === "edit" ? (
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            className="text-sm text-rose-600 hover:text-rose-800 disabled:opacity-50"
          >
            Eliminar corner
          </button>
        ) : <span />}
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition disabled:opacity-50"
        >
          {pending ? "Guardando..." : mode === "create" ? "Crear corner" : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
