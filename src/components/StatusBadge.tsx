import { ESTADO_META, type Estado } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function StatusBadge({ estado, className }: { estado: Estado; className?: string }) {
  const meta = ESTADO_META[estado];
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
      meta.bg,
      meta.color,
      meta.ring,
      className
    )}>
      {meta.label}
    </span>
  );
}
