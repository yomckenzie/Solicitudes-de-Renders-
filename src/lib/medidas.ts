export type Medida = { nombre: string; valor: string; unidad: string };

export const MEDIDAS_ESTANDAR: string[] = [
  "Ancho", "Alto", "Fondo", "Sócalo", "Fascia", "Alto columna",
];

export function parseMedidas(raw: string | null | undefined): Medida[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as Medida[];
  } catch {}
  // Texto libre heredado → convertir a una sola medida
  return [{ nombre: "Medidas", valor: raw, unidad: "" }];
}

export function serializeMedidas(medidas: Medida[]): string | null {
  const filled = medidas.filter(m => m.valor.trim());
  if (filled.length === 0) return null;
  return JSON.stringify(filled);
}

export function medidasResumen(raw: string | null | undefined): string {
  const list = parseMedidas(raw);
  if (list.length === 0) return "";
  return list
    .filter(m => m.valor)
    .map(m => `${m.nombre}: ${m.valor}${m.unidad ? m.unidad : ""}`)
    .join(" · ");
}
