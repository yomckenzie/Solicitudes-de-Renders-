import { EstadoEspacio, EstadoSolicitud, ESTADO_ESPACIO_COLORS, ESTADO_SOLICITUD_COLORS, ESTADO_SOLICITUD_LABELS } from "@/types";

export function BadgeEstadoEspacio({ estado }: { estado: EstadoEspacio }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ESTADO_ESPACIO_COLORS[estado]}`}>
      {estado}
    </span>
  );
}

export function BadgeEstadoSolicitud({ estado }: { estado: EstadoSolicitud }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ESTADO_SOLICITUD_COLORS[estado]}`}>
      {ESTADO_SOLICITUD_LABELS[estado]}
    </span>
  );
}
