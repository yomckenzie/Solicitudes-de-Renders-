"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, X, Loader2, Download, ImageIcon } from "lucide-react";
import { uploadFoto, deleteFoto } from "@/app/actions/fotos";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface Foto {
  id: string;
  url: string;
  thumbnail_url: string | null;
  fecha: string;
}

export function PhotoGallery({
  cornerRowId,
  fotos,
}: {
  cornerRowId: string;
  fotos: Foto[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    startTransition(async () => {
      try {
        await uploadFoto(cornerRowId, fd);
        toast.success("Foto subida");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error al subir");
      }
    });
    e.target.value = "";
  };

  const onDelete = (id: string) => {
    if (!confirm("¿Eliminar esta foto?")) return;
    startTransition(async () => {
      try {
        await deleteFoto(id);
        toast.success("Foto eliminada");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error al eliminar");
      }
    });
  };

  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200/60">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Galería</h3>
          <p className="text-xs text-slate-500">{fotos.length} foto{fotos.length === 1 ? "" : "s"}</p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-800 transition disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          Subir foto
        </button>
        <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onPick} />
      </div>

      {fotos.length === 0 ? (
        <div className="mt-6 rounded-lg border-2 border-dashed border-slate-200 p-10 text-center">
          <ImageIcon className="h-10 w-10 mx-auto text-slate-300" />
          <p className="mt-2 text-sm text-slate-500">Sin fotos todavía</p>
          <p className="text-xs text-slate-400">Subí fotos de referencia o del estado actual</p>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {fotos.map((f) => (
            <div key={f.id} className="group relative aspect-square overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200">
              <button
                onClick={() => setLightbox(f.url)}
                className="block w-full h-full"
                title="Ver en alta resolución"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={f.thumbnail_url || f.url}
                  alt={`Foto del ${formatDate(f.fecha)}`}
                  loading="lazy"
                  className="w-full h-full object-cover transition group-hover:scale-105"
                />
              </button>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition">
                <p className="text-[10px] text-white">{formatDate(f.fecha)}</p>
              </div>
              <button
                onClick={() => onDelete(f.id)}
                className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white opacity-0 group-hover:opacity-100 transition"
                title="Eliminar"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-50 bg-black/80 grid place-items-center p-4 cursor-zoom-out"
        >
          <div className="relative max-w-5xl max-h-[90vh]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lightbox} alt="Foto ampliada" className="max-w-full max-h-[90vh] rounded-lg" />
            <a
              href={lightbox}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-lg bg-white/90 px-3 py-1.5 text-sm font-medium text-slate-900 hover:bg-white"
            >
              <Download className="h-4 w-4" /> Descargar
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
