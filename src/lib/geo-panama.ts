// Geocodificación aproximada de ubicaciones de Panamá.
// Coordenadas [lat, lng] de malls/zonas conocidas y centros de provincia.
// Se usa para ubicar los puntos de venta en el mapa.

export type LatLng = [number, number];

// Centro geográfico de Panamá (para vista inicial del mapa)
export const PANAMA_CENTER: LatLng = [8.7, -80.2];
export const PANAMA_ZOOM = 7;

// Malls / zonas específicas — se buscan por coincidencia de palabra clave en mallZona
const MALLS: { keywords: string[]; coords: LatLng }[] = [
  // Ciudad de Panamá
  { keywords: ["albrook"], coords: [8.974, -79.5536] },
  { keywords: ["multiplaza"], coords: [9.0064, -79.506] },
  { keywords: ["metromall"], coords: [9.045, -79.452] },
  { keywords: ["megapolis"], coords: [9.008, -79.503] },
  { keywords: ["megamall"], coords: [9.062, -79.474] },
  { keywords: ["altaplaza", "alta plaza"], coords: [9.048, -79.564] },
  { keywords: ["los pueblos"], coords: [9.059, -79.473] },
  { keywords: ["los andes"], coords: [9.064, -79.492] },
  { keywords: ["calidonia"], coords: [8.967, -79.534] },
  { keywords: ["san miguelito"], coords: [9.033, -79.5] },
  { keywords: ["villa lucre"], coords: [9.053, -79.475] },
  { keywords: ["villa zaita"], coords: [9.108, -79.556] },
  { keywords: ["24 dic", "24 diciembre", "la doña", "la dona", "tocumen"], coords: [9.085, -79.396] },
  { keywords: ["av. central", "av central", "via españa", "via espana", "central"], coords: [8.975, -79.524] },
  { keywords: ["plaza italia"], coords: [8.984, -79.527] },
  { keywords: ["plaza mirage"], coords: [8.982, -79.518] },
  { keywords: ["dorado"], coords: [9.02, -79.53] },
  { keywords: ["hato montaña", "hato montana"], coords: [9.13, -79.55] },
  // Panamá Oeste
  { keywords: ["westland"], coords: [8.923, -79.69] },
  { keywords: ["coronado"], coords: [8.53, -79.95] },
  { keywords: ["burunga"], coords: [8.94, -79.67] },
  { keywords: ["arraijan", "arraiján"], coords: [8.9517, -79.6608] },
  { keywords: ["chorrera"], coords: [8.8803, -79.7833] },
  // Chiriquí
  { keywords: ["federal mall", "federal"], coords: [8.41, -82.43] },
  { keywords: ["paso canoa", "paso canoas"], coords: [8.53, -82.84] },
  { keywords: ["david", "chiriqui", "chiriquí"], coords: [8.4333, -82.4333] },
  // Veraguas
  { keywords: ["santiago"], coords: [8.1003, -80.9833] },
  // Herrera
  { keywords: ["chitre", "chitré"], coords: [7.9614, -80.4297] },
  // Coclé
  { keywords: ["aguadulce"], coords: [8.2479, -80.5456] },
  { keywords: ["penonome", "penonomé"], coords: [8.518, -80.3578] },
  // Colón
  { keywords: ["4 altos", "cuatro altos"], coords: [9.334, -79.877] },
  { keywords: ["colon", "colón"], coords: [9.3592, -79.9014] },
  // Bocas del Toro
  { keywords: ["bocas"], coords: [9.34, -82.24] },
];

// Fallback por provincia (centro de la ciudad principal)
const PROVINCIAS: Record<string, LatLng> = {
  "Panamá": [8.9824, -79.5199],
  "Chorrera": [8.8803, -79.7833],
  "Arraijan": [8.9517, -79.6608],
  "Colón": [9.3592, -79.9014],
  "Chiriquí": [8.4333, -82.4333],
  "Veraguas": [8.1003, -80.9833],
  "Coclé": [8.518, -80.3578],
  "Herrera": [7.9614, -80.4297],
  "Bocas del Toro": [9.34, -82.24],
};

/**
 * Devuelve coordenadas [lat, lng] para un PDV según su mallZona y provincia.
 * Aplica un pequeño desplazamiento determinístico (jitter) basado en el id
 * para que los marcadores en la misma ubicación no se superpongan.
 */
export function geocodePdv(mallZona: string | null, provincia: string | null, seed: string): LatLng | null {
  let base: LatLng | null = null;

  if (mallZona) {
    const lower = mallZona.toLowerCase();
    for (const mall of MALLS) {
      if (mall.keywords.some((k) => lower.includes(k))) {
        base = mall.coords;
        break;
      }
    }
  }

  if (!base && provincia) {
    base = PROVINCIAS[provincia] ?? null;
  }

  if (!base) return null;

  // Jitter determinístico (~±0.04°, ~4km) a partir del seed
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const jLat = (((h % 1000) / 1000) - 0.5) * 0.08;
  const jLng = ((((h >> 10) % 1000) / 1000) - 0.5) * 0.08;

  return [base[0] + jLat, base[1] + jLng];
}
