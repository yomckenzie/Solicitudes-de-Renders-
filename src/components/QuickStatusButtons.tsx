"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ESTADOS, ESTADO_META, type Estado } from "@/lib/constants";
import { changeStatus } from "@/app/actions/corners";
import { cn } from "@/lib/utils";

export function QuickStatusButtons({ cornerId, current }: { cornerId: string; current: Estado }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const handle = (estado: Estado) => {
    if (estado === current) return;
    startTransition(async () => {
      try {
        await changeStatus(cornerId, estado);
        toast.success(`Marcado como "${ESTADO_META[estado].label}"`);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error desconocido");
      }
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      {ESTADOS.map((e) => (
        <button
          key={e}
          onClick={() => handle(e)}
          disabled={pending || e === current}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-semibold transition ring-1 ring-inset",
            e === current
              ? `${ESTADO_META[e].bg} ${ESTADO_META[e].color} ${ESTADO_META[e].ring} opacity-100`
              : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50",
            pending && "opacity-50"
          )}
        >
          {ESTADO_META[e].label}
        </button>
      ))}
    </div>
  );
}
