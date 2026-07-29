"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { geocodePdv, PANAMA_CENTER, PANAMA_ZOOM, PROVINCIAS_PANAMA, type LatLng } from "@/lib/geo-panama";
import "leaflet/dist/leaflet.css";

export type PdvMapaItem = {
  id: string;
  numeroPdv: number;
  cadena: string;
  mallZona: string | null;
  provincia: string | null;
  marca: string | null;
  estado: string;
};

interface PanamaMapaProps {
  pdvs: PdvMapaItem[];
  /** Cuando cambia, el mapa hace zoom al centro de esa provincia */
  focusProvincia?: string | null;
}

const ESTADO_COLOR: Record<string, string> = {
  Critico: "#ef4444",
  Desactualizado: "#f59e0b",
  Normal: "#3b82f6",
  Actualizado: "#22c55e",
};

const ESTADO_LABEL: { estado: string; color: string; label: string }[] = [
  { estado: "Critico", color: "#ef4444", label: "Crítico" },
  { estado: "Desactualizado", color: "#f59e0b", label: "Desactualizado" },
  { estado: "Normal", color: "#3b82f6", label: "Normal" },
  { estado: "Actualizado", color: "#22c55e", label: "Actualizado" },
];

type MarkerEntry = { marker: import("leaflet").CircleMarker; provincia: string | null };

export function PanamaMapa({ pdvs, focusProvincia }: PanamaMapaProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<import("leaflet").Map | null>(null);
  const initialBoundsRef = useRef<LatLng[] | null>(null);
  const markersRef = useRef<MarkerEntry[]>([]);
  const router = useRouter();
  const [ubicados, setUbicados] = useState(0);

  useEffect(() => {
    if (!mapRef.current) return;
    let map: import("leaflet").Map | null = null;
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !mapRef.current) return;

      map = L.map(mapRef.current, {
        center: PANAMA_CENTER,
        zoom: PANAMA_ZOOM,
        scrollWheelZoom: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      const bounds: LatLng[] = [];
      let count = 0;

      for (const pdv of pdvs) {
        const coords = geocodePdv(pdv.mallZona, pdv.provincia, pdv.id);
        if (!coords) continue;
        count++;
        bounds.push(coords);

        const color = ESTADO_COLOR[pdv.estado] ?? "#6b7280";
        const marker = L.circleMarker(coords, {
          radius: 7,
          fillColor: color,
          color: "#ffffff",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.9,
        }).addTo(map!);

        const popupHtml = `
          <div style="font-family: system-ui, sans-serif; min-width: 160px;">
            <div style="font-weight: 700; font-size: 13px; color: #111;">PDV-${pdv.numeroPdv}</div>
            <div style="font-size: 12px; color: #374151; margin-top: 2px;">${pdv.cadena}</div>
            <div style="font-size: 11px; color: #6b7280;">${pdv.mallZona ?? ""} · ${pdv.provincia ?? ""}</div>
            <div style="display:flex; align-items:center; gap:4px; margin-top:6px;">
              <span style="width:8px;height:8px;border-radius:50%;background:${color};display:inline-block;"></span>
              <span style="font-size:11px;color:#374151;">${pdv.estado}${pdv.marca ? " · " + pdv.marca : ""}</span>
            </div>
            <a href="/dashboard/pdv/${pdv.id}" style="display:inline-block;margin-top:8px;font-size:11px;color:#2563eb;text-decoration:none;font-weight:600;">Ver detalle →</a>
          </div>`;
        marker.bindPopup(popupHtml);
        marker.on("dblclick", () => router.push(`/dashboard/pdv/${pdv.id}`));
        markersRef.current.push({ marker, provincia: pdv.provincia ?? null });
      }

      if (bounds.length > 0) {
        map.fitBounds(bounds as [number, number][], { padding: [30, 30] });
        initialBoundsRef.current = bounds;
      }
      mapInstanceRef.current = map;
      if (!cancelled) setUbicados(count);
    })();

    return () => {
      cancelled = true;
      mapInstanceRef.current = null;
      initialBoundsRef.current = null;
      markersRef.current = [];
      if (map) map.remove();
    };
  }, [pdvs, router]);

  // Reaccionar al cambio de focusProvincia: zoom + filtro visual de marcadores
  useEffect(() => {
    const m = mapInstanceRef.current;
    if (!m) return;

    // Mostrar/ocultar marcadores según provincia
    for (const { marker, provincia } of markersRef.current) {
      const visible = !focusProvincia || provincia === focusProvincia;
      if (visible) {
        if (!m.hasLayer(marker)) marker.addTo(m);
      } else {
        if (m.hasLayer(marker)) m.removeLayer(marker);
      }
    }

    if (focusProvincia) {
      // Zoom a la provincia
      const coords = PROVINCIAS_PANAMA[focusProvincia];
      if (coords) m.flyTo(coords, 10, { duration: 0.8 });
    } else {
      // Deseleccionado → volver a la vista panorámica
      const bounds = initialBoundsRef.current;
      if (bounds && bounds.length > 0) {
        m.flyToBounds(bounds as [number, number][], { padding: [30, 30], duration: 0.8 });
      } else {
        m.flyTo(PANAMA_CENTER, PANAMA_ZOOM, { duration: 0.8 });
      }
    }
  }, [focusProvincia]);

  const sinUbicar = pdvs.length - ubicados;

  return (
    <div className="space-y-3">
      <div
        ref={mapRef}
        className="w-full rounded-xl border border-gray-200 z-0"
        style={{ height: "420px" }}
      />

      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
        {ESTADO_LABEL.map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-full border border-white shadow-sm"
              style={{ backgroundColor: color }}
            />
            {label}
          </span>
        ))}
        <span className="ml-auto text-gray-400">
          {ubicados} de {pdvs.length} PDV ubicados
          {sinUbicar > 0 ? ` · ${sinUbicar} sin coordenadas` : ""}
        </span>
      </div>
    </div>
  );
}
