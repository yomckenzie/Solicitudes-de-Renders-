/**
 * Script de carga inicial de datos desde Excel y PDF.
 * Ejecutar: node scripts/seed.mjs
 */
import XLSX from "xlsx";
import { readFileSync } from "fs";
import { createRequire } from "module";

const SUPABASE_URL = "https://api.supabase.com/v1/projects/fvvbkkpvraonnsedxtoz/database/query";
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
if (!ACCESS_TOKEN) throw new Error("Falta SUPABASE_ACCESS_TOKEN en las variables de entorno");

async function query(sql) {
  const res = await fetch(SUPABASE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Error SQL: ${text}`);
  return JSON.parse(text);
}

function getProvince(zona, ciudad) {
  const map = {
    VERAGUAS: "Veraguas",
    CHIRIQUI: "Chiriquí",
    FRONTERA: "Chiriquí",
    COCLE: "Coclé",
    HERRERA: "Herrera",
    "LOS SANTOS": "Los Santos",
    "BOCAS DEL TORO": "Bocas del Toro",
    METRO: "Panamá",
    NORTE: "Panamá",
  };
  if (map[zona]) return map[zona];
  if (zona === "ESTE") {
    if (["COLON", "CATIVA", "SABANITAS"].includes(ciudad)) return "Colón";
    return "Panamá";
  }
  if (zona === "OESTE") {
    if (ciudad === "CHORRERA") return "Chorrera";
    if (["ARRAIJAN", "VISTA ALEGRE", "ANCLAS"].includes(ciudad)) return "Arraijan";
    return "Panamá";
  }
  return "Panamá";
}

function getCadena(name) {
  const n = name.toUpperCase();
  if (n.includes("STEVENS")) return "Stevens";
  if (n.includes("CAMPEON") || n.includes("CAMPEÓN")) return "Campeon";
  if (n.includes("TITAN") || n.includes("TITÁN")) return "Titan";
  if (n.includes("MADISON")) return "Madison";
  if (n.includes("CONWAY")) return "Conway";
  if (n.includes("MACHETAZO")) return "Machetazo";
  if (n.includes("LA ONDA")) return "La Onda";
  if (n.includes("EL FUERTE") || (n.includes("FUERTE") && !n.includes("CONWAY"))) return "El Fuerte";
  if (n.includes("SAKS") || n.includes("DORIANS")) return "Saks";
  if (n.includes("PICADILLY")) return "Picadilly";
  if (n.includes("DDP") || n.includes("DISTRIBUIDORA DEL PACIFICO")) return "DDP";
  if (n.includes("ECOMODA")) return "Ecomoda";
  if (n.includes("OCA LOCA")) return "OCA Loca";
  if (n.includes("XTRA") || n.includes("SUPER XTRA")) return "Xtra";
  if (n.includes("EL COSTO") || n.includes("COSTO ")) return "El Costo";
  if (n.includes("LEVYCOH") || n.includes("JOHNNY COTTON TIENDA")) return "JC Tienda Propia";
  if (n.includes("PUNTO MAYORISTA")) return "Punto Mayorista";
  if (n.includes("PUNTO PODEROSO")) return "Punto Poderoso";
  if (n.includes("A-MANI") || n.includes("AMANI")) return "Amani";
  if (n.includes("JORDANIA") || n.includes("JORDANA")) return "Jordania";
  if (n.includes("BAZAR PALESTINA")) return "Bazar Palestina";
  if (n.includes("CITY MALL")) return "City Mall";
  if (n.includes("BOSSINI")) return "Bossini";
  if (n.includes("CORNER CALIDONIA")) return "Corner";
  return name.split(" ")[0];
}

function getMarca(jcC, jcI, ckC, ckI) {
  const jc = String(jcC).trim().toUpperCase() === "SI" || String(jcI).trim().toUpperCase() === "SI";
  const ck = String(ckC).trim().toUpperCase() === "SI" || String(ckI).trim().toUpperCase() === "SI";
  if (jc) return "JohnnyCotton";
  if (ck) return "ChessKing";
  return "JohnnyCotton";
}

function getEspacio(tipo) {
  const t = String(tipo || "").toUpperCase();
  if (t.startsWith("A ") || t === "A" || t.includes("RETAIL A")) return 3;
  if (t.startsWith("B") || t.includes("A Y B") || t.includes("B Y A") || t.includes("RETAIL B")) return 2;
  if (t.startsWith("C") || t.includes("RETAIL C")) return 1;
  return 2;
}

function esc(str) {
  return String(str || "").replace(/'/g, "''");
}

// ─── 1. Cargar Excel ──────────────────────────────────────────────────────────
console.log("\n📊 Leyendo Excel...");
const wb = XLSX.readFile(
  "/root/.claude/uploads/c3edd96d-a4e4-5ad6-ab56-987525baa363/fd3bead4-MATRIX_DE_CLIENTES_PANAMA_SIS_y_SEGMENTACION_1.xlsx"
);
const ws = wb.Sheets["MATRIX CLIENTES NACIONALES"];
const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1 }).slice(3).filter((r) => r && r[0] && r[3]);
console.log(`  → ${rawRows.length} clientes encontrados`);

// ─── 2. Insertar clientes de Matrix Excel (PDV 1-179) ────────────────────────
console.log("\n🏪 Insertando clientes del Excel en puntos_de_venta...");

// Limpiar tabla primero
await query("TRUNCATE puntos_de_venta CASCADE");
console.log("  → Tabla limpiada");

let inserted = 0;
const batchSize = 20;

for (let i = 0; i < rawRows.length; i += batchSize) {
  const batch = rawRows.slice(i, i + batchSize);
  const values = batch.map((r, idx) => {
    const ciudad   = String(r[0] || "").trim();
    const zona     = String(r[1] || "").trim();
    const tipoPuerta = r[4];
    const razonSocial = String(r[8] || "").trim();
    const vendedor = String(r[9] || "").trim();
    const jcCasual  = r[10];
    const jcInterior = r[11];
    const ckCasual  = r[12];
    const ckInterior = r[13];
    const storeName = String(r[3] || "").trim();

    const num = i + idx + 1;
    const espacio = getEspacio(tipoPuerta);
    const provincia = getProvince(zona, ciudad);
    const cadena = getCadena(storeName);
    const marca = getMarca(jcCasual, jcInterior, ckCasual, ckInterior);
    const mallZona = ciudad;
    const now = "NOW()";

    return `(${num}, ${espacio}, 'Panamá', '${esc(provincia)}', '${esc(cadena)}', '${esc(mallZona)}', '${esc(storeName)}', '${marca}', '${esc(vendedor)}', NULL, 'Normal', NULL, ${now}, ${now})`;
  });

  const sql = `INSERT INTO puntos_de_venta ("numeroPdv", "espacio", "pais", "provincia", "cadena", "mallZona", "mallZona_nombre", "marca", "impulsador", "frecuenciaVisita", "estado", "fechaUltimaVisita", "createdAt", "updatedAt") VALUES ${values.join(",\n")}`;

  // La tabla no tiene mallZona_nombre — usar esquema correcto
  const sqlCorrect = `INSERT INTO puntos_de_venta ("numeroPdv", espacio, pais, provincia, cadena, "mallZona", marca, impulsador, "frecuenciaVisita", estado, "fechaUltimaVisita", "createdAt", "updatedAt") VALUES ${batch.map((r, idx) => {
    const ciudad = String(r[0] || "").trim();
    const zona = String(r[1] || "").trim();
    const tipoPuerta = r[4];
    const vendedor = String(r[9] || "").trim();
    const jcCasual = r[10]; const jcInterior = r[11];
    const ckCasual = r[12]; const ckInterior = r[13];
    const storeName = String(r[3] || "").trim();
    const num = i + idx + 1;
    return `(${num}, ${getEspacio(tipoPuerta)}, 'Panamá', '${esc(getProvince(zona, ciudad))}', '${esc(getCadena(storeName))}', '${esc(ciudad + " — " + storeName)}', '${getMarca(jcCasual, jcInterior, ckCasual, ckInterior)}', '${esc(vendedor)}', NULL, 'Normal', NULL, NOW(), NOW())`;
  }).join(",\n")}`;

  try {
    await query(sqlCorrect);
    inserted += batch.length;
    process.stdout.write(`\r  → ${inserted}/${rawRows.length} insertados`);
  } catch (e) {
    console.error(`\n  ❌ Error en lote ${i}: ${e.message}`);
  }
}
console.log(`\n  ✅ ${inserted} puntos de venta del Excel insertados`);

// ─── 3. Insertar datos de inventario del PDF (PDV 1-100 con mobiliario) ───────
console.log("\n🪑 Insertando inventario de mobiliario (PDF)...");

// Datos reales extraídos del PDF Control de Puntos de Venta
const pdvInventario = [
  // PDV, espacio, provincia, cadena, zona, marca, cornerCasual, racksCasual, gondolaCasual, cabezalesCasual, centroMesa, columnaCasual, paredCasual, cornerInterior, gondolaInterior, columnaInterior, paredInterior, impulsador, estado
  [1, 2, "Panamá", "Stevens", "Albrook", "JohnnyCotton", 1,1,2,0,0,0,0,1,0,0,0, "Lorena Pinto", "Critico"],
  [1, 1, "Panamá", "Stevens", "Albrook", "JCX", 0,0,2,0,0,0,0,0,0,0,0, "Lorena Pinto", "Desactualizado"],
  [2, 2, "Panamá", "Stevens", "Alta Plaza", "JohnnyCotton", 1,0,2,0,1,0,0,1,1,0,0, "Lorena Pinto", "Actualizado"],
  [2, 1, "Panamá", "Stevens", "Alta Plaza", "JCX", 1,2,1,0,0,0,0,0,0,0,0, "Lorena Pinto", "Normal"],
  [3, 2, "Panamá", "Stevens", "Multiplaza", "JohnnyCotton", 0,1,0,0,0,0,0,1,0,0,0, "Lorena Pinto", "Normal"],
  [3, 1, "Panamá", "Stevens", "Multiplaza", "JCX", 1,2,2,0,0,0,0,0,0,0,0, "Lorena Pinto", "Normal"],
  [4, 3, "Chorrera", "Stevens", "Westland Mall", "JohnnyCotton", 1,0,2,0,1,0,0,1,0,0,0, "Isis Ramirez", "Normal"],
  [5, 2, "Panamá", "Stevens", "Metromall", "JohnnyCotton", 1,1,3,0,1,0,0,1,1,0,0, "Alcibiades Tenorio", "Normal"],
  [5, 1, "Panamá", "Stevens", "Metromall", "JCX", 1,1,2,0,0,0,0,0,0,0,0, "Alcibiades Tenorio", "Normal"],
  [5, 1, "Chiriquí", "Stevens", "Federal Mall David", "RAFFINE", 0,0,0,0,0,0,0,1,0,0,0, "Alcibiades Tenorio", "Normal"],
  [5, 1, "Chiriquí", "Stevens", "Federal Mall David", "JCX", 1,1,1,0,0,0,0,0,0,0,0, "Alcibiades Tenorio", "Normal"],
  [6, 2, "Panamá", "Campeon", "Albrook", "JohnnyCotton", 1,0,0,0,0,0,0,2,0,0,0, "Lorena Pinto", "Normal"],
  [6, 2, "Panamá", "Campeon", "Albrook", "ChessKing", 1,0,0,0,0,0,0,2,0,0,0, "Lorena Pinto", "Normal"],
  [7, 2, "Panamá", "Campeon", "Westland Mall", "JohnnyCotton", 1,0,0,0,0,0,0,1,0,0,0, "Lorena Pinto", "Normal"],
  [7, 2, "Panamá", "Campeon", "Westland Mall", "ChessKing", 1,0,0,0,0,0,0,1,0,0,0, "Lorena Pinto", "Normal"],
  [8, 2, "Chorrera", "Campeon", "Plaza Italia", "JohnnyCotton", 1,0,0,0,0,0,1,1,0,0,0, "Lorena Pinto", "Normal"],
  [8, 2, "Chorrera", "Campeon", "Plaza Italia", "ChessKing", 1,0,0,0,0,0,1,1,0,0,0, "Lorena Pinto", "Normal"],
  [9, 3, "Panamá", "Campeon", "Los Andes Mall", "JohnnyCotton", 1,0,0,0,0,0,0,1,0,1,0, "Lorena Pinto", "Normal"],
  [9, 2, "Panamá", "Campeon", "Los Andes Mall", "ChessKing", 1,0,0,0,0,0,0,1,0,0,0, "Lorena Pinto", "Normal"],
  [10, 1, "Panamá", "Campeon", "Av. Central", "JohnnyCotton", 0,0,0,0,0,1,1,1,0,0,0, "Lorena Pinto", "Critico"],
  [11, 2, "Veraguas", "Campeon", "Central Santiago", "JohnnyCotton", 1,0,0,0,0,0,0,1,0,0,0, "Alcibiades Tenorio", "Normal"],
  [11, 2, "Veraguas", "Campeon", "Central Santiago", "ChessKing", 1,0,0,0,0,0,0,1,0,0,0, "Alcibiades Tenorio", "Normal"],
  [11, 2, "Herrera", "Campeon", "Chitré", "JohnnyCotton", 1,0,0,0,0,0,0,1,0,0,0, "Alcibiades Tenorio", "Normal"],
  [11, 2, "Herrera", "Campeon", "Chitré", "ChessKing", 1,0,0,0,0,0,0,1,0,0,0, "Alcibiades Tenorio", "Normal"],
  [12, 2, "Chiriquí", "Campeon", "David", "JohnnyCotton", 0,0,0,0,0,1,0,1,0,0,0, "Alcibiades Tenorio", "Normal"],
  [13, 2, "Panamá", "Campeon", "Megamall", "JohnnyCotton", 1,0,0,0,0,0,0,1,0,0,0, "Lorena Pinto", "Normal"],
  [13, 2, "Panamá", "Campeon", "Megamall", "ChessKing", 1,0,0,0,0,0,0,1,0,0,0, "Lorena Pinto", "Normal"],
  [14, 2, "Colón", "Campeon", "4 Altos", "JohnnyCotton", 1,0,0,0,0,0,0,1,0,0,0, "Alcibiades Tenorio", "Normal"],
  [14, 2, "Colón", "Campeon", "4 Altos", "ChessKing", 1,0,0,0,0,0,0,1,0,0,0, "Alcibiades Tenorio", "Normal"],
  [15, 2, "Panamá", "Titan", "Albrook", "JohnnyCotton", 1,0,0,0,0,0,0,1,0,0,0, "Lorena Pinto", "Actualizado"],
  [15, 2, "Panamá", "Titan", "Albrook", "ChessKing", 1,0,0,0,0,0,0,1,0,0,0, "Lorena Pinto", "Actualizado"],
  [16, 2, "Panamá", "Titan", "Metromall", "JohnnyCotton", 1,0,0,0,0,0,0,1,0,0,0, "Lorena Pinto", "Normal"],
  [16, 2, "Panamá", "Titan", "Metromall", "ChessKing", 1,0,0,0,0,0,0,1,0,0,0, "Lorena Pinto", "Normal"],
  [17, 1, "Panamá", "Titan", "Calidonia", "JohnnyCotton", 0,0,0,0,0,0,1,1,0,0,1, "Lorena Pinto", "Critico"],
  [18, 2, "Colón", "Titan", "4 Altos", "JohnnyCotton", 1,0,0,0,0,0,0,1,0,0,0, "Alcibiades Tenorio", "Normal"],
  [18, 2, "Colón", "Titan", "4 Altos", "ChessKing", 1,0,1,0,0,0,0,0,0,0,1, "Alcibiades Tenorio", "Normal"],
  [19, 2, "Panamá", "Titan", "Los Andes Mall", "JohnnyCotton", 1,0,0,0,0,0,0,1,0,0,0, "Lorena Pinto", "Normal"],
  [19, 2, "Panamá", "Titan", "Los Andes Mall", "ChessKing", 1,0,0,0,0,0,0,1,0,0,0, "Lorena Pinto", "Normal"],
  [20, 2, "Panamá", "Titan", "Los Pueblos", "JohnnyCotton", 1,0,0,0,0,0,0,1,0,0,0, "Lorena Pinto", "Normal"],
  [20, 2, "Panamá", "Titan", "Los Pueblos", "ChessKing", 1,0,0,0,0,0,0,1,0,0,0, "Lorena Pinto", "Normal"],
  [21, 2, "Chorrera", "Titan", "Westland Mall", "JohnnyCotton", 1,0,0,0,0,0,0,1,0,0,0, "Isis Ramirez", "Normal"],
  [21, 2, "Chorrera", "Titan", "Westland Mall", "ChessKing", 1,0,0,0,0,0,0,1,0,0,0, "Isis Ramirez", "Normal"],
  [22, 2, "Chiriquí", "Titan", "David", "JohnnyCotton", 1,0,0,0,0,0,0,1,0,0,0, "Alcibiades Tenorio", "Normal"],
  [22, 2, "Chiriquí", "Titan", "David", "ChessKing", 1,0,2,0,0,0,0,1,0,0,0, "Alcibiades Tenorio", "Normal"],
  [23, 3, "Panamá", "Madison", "Albrook", "JohnnyCotton", 1,0,0,0,0,1,1,1,0,1,1, "Lorena Pinto", "Normal"],
  [23, 2, "Panamá", "Madison", "Albrook", "ChessKing", 0,0,0,0,0,1,1,1,0,0,1, "Lorena Pinto", "Normal"],
  [24, 2, "Veraguas", "Madison", "Santiago", "JohnnyCotton", 1,0,0,0,0,0,0,1,0,0,0, "Alcibiades Tenorio", "Normal"],
  [24, 2, "Veraguas", "Madison", "Santiago", "ChessKing", 1,0,0,0,0,0,0,1,0,0,0, "Alcibiades Tenorio", "Normal"],
  [25, 2, "Panamá", "Madison", "Los Andes Mall", "JohnnyCotton", 1,0,0,0,0,0,0,1,0,0,0, "Lorena Pinto", "Normal"],
  [25, 2, "Panamá", "Madison", "Los Andes Mall", "ChessKing", 1,0,0,0,0,0,0,1,0,0,0, "Lorena Pinto", "Normal"],
  [26, 2, "Herrera", "Madison", "Chitré", "JohnnyCotton", 1,0,0,0,0,0,0,1,0,0,0, "Alcibiades Tenorio", "Normal"],
  [26, 2, "Herrera", "Madison", "Chitré", "ChessKing", 1,0,0,0,0,0,0,1,0,0,0, "Alcibiades Tenorio", "Normal"],
  [27, 1, "Panamá", "Conway", "Los Pueblos", "JohnnyCotton", 0,0,0,0,0,0,0,1,0,0,0, "Lorena Pinto", "Desactualizado"],
  [27, 3, "Panamá", "Conway", "Los Pueblos", "ChessKing", 1,0,1,1,0,0,0,0,0,1,0, "Lorena Pinto", "Normal"],
  [28, 2, "Panamá", "Conway", "Megapolis", "JohnnyCotton", 1,0,1,0,1,0,0,1,0,0,0, "Lorena Pinto", "Normal"],
  [29, 2, "Chorrera", "Conway", "Westland Mall", "JohnnyCotton", 1,0,1,0,1,0,0,1,0,0,0, "Isis Ramirez", "Normal"],
  [29, 1, "Chorrera", "Conway", "Westland Mall", "ChessKing", 1,0,1,0,1,0,0,0,0,0,0, "Isis Ramirez", "Normal"],
  [30, 2, "Panamá", "Conway", "Albrook", "JohnnyCotton", 1,0,0,0,1,0,0,1,0,0,0, "Lorena Pinto", "Normal"],
  [30, 1, "Panamá", "Conway", "Albrook", "ChessKing", 1,0,1,0,0,0,0,0,0,0,0, "Lorena Pinto", "Normal"],
  [31, 2, "Chiriquí", "Conway", "David", "JohnnyCotton", 1,0,1,0,1,0,0,1,0,0,0, "Alcibiades Tenorio", "Normal"],
  [32, 1, "Chorrera", "La Onda", "Westland Mall", "JohnnyCotton", 1,0,0,0,0,0,0,1,0,0,0, "Isis Ramirez", "Normal"],
  [32, 1, "Chorrera", "La Onda", "Westland Mall", "ChessKing", 1,0,0,0,0,0,0,1,0,0,0, "Isis Ramirez", "Normal"],
  [33, 1, "Panamá", "La Onda", "Villa Lucre", "JohnnyCotton", 1,0,0,0,0,0,0,1,0,0,0, "Lorena Pinto", "Normal"],
  [34, 1, "Panamá", "La Onda", "David", "JohnnyCotton", 1,0,0,0,0,0,0,1,0,0,0, "Lorena Pinto", "Normal"],
  [35, 1, "Panamá", "La Onda", "Los Pueblos", "JohnnyCotton", 1,0,0,0,0,0,0,1,0,0,1, "Lorena Pinto", "Normal"],
  [36, 1, "Panamá", "La Onda", "Los Andes Mall", "JohnnyCotton", 1,0,0,0,0,0,0,1,0,0,0, "Lorena Pinto", "Normal"],
  [37, 2, "Panamá", "La Onda", "San Miguelito", "JohnnyCotton", 1,0,0,0,0,0,0,1,0,0,0, "Lorena Pinto", "Normal"],
  [38, 1, "Panamá", "La Onda", "Plaza Mirage", "JohnnyCotton", 1,0,0,0,0,0,0,1,0,0,0, "Lorena Pinto", "Normal"],
  [39, 1, "Panamá", "La Onda", "Calidonia", "JohnnyCotton", 1,0,0,0,0,0,0,0,1,0,0, "Lorena Pinto", "Normal"],
  [40, 2, "Panamá", "El Fuerte", "San Miguelito", "JohnnyCotton", 1,0,0,0,0,0,0,1,1,0,0, "Lorena Pinto", "Normal"],
  [40, 2, "Panamá", "El Fuerte", "San Miguelito", "ChessKing", 1,0,0,0,0,0,0,1,1,0,0, "Lorena Pinto", "Normal"],
  [41, 2, "Panamá", "El Fuerte", "Villa Zaita", "JohnnyCotton", 1,0,0,0,0,0,0,1,0,0,0, "Lorena Pinto", "Normal"],
  [41, 2, "Panamá", "El Fuerte", "Villa Zaita", "ChessKing", 1,0,0,0,0,0,0,0,0,1,1, "Lorena Pinto", "Normal"],
  [42, 2, "Arraijan", "El Fuerte", "Burunga", "JohnnyCotton", 1,0,0,0,0,0,0,1,0,0,0, "Lorena Pinto", "Normal"],
  [42, 2, "Arraijan", "El Fuerte", "Burunga", "ChessKing", 1,0,0,0,0,0,0,1,0,0,0, "Lorena Pinto", "Normal"],
  [43, 2, "Panamá", "El Fuerte", "24 Diciembre", "JohnnyCotton", 1,0,0,0,0,0,0,1,0,0,0, "Lorena Pinto", "Normal"],
  [43, 2, "Panamá", "El Fuerte", "24 Diciembre", "ChessKing", 1,0,0,0,0,0,0,1,0,0,0, "Lorena Pinto", "Normal"],
  [44, 2, "Panamá", "Machetazo", "Av. Central", "JohnnyCotton", 0,0,0,0,0,1,0,0,0,1,0, "Lorena Pinto", "Critico"],
  [45, 2, "Panamá", "Machetazo", "Calidonia", "JohnnyCotton", 1,0,0,0,0,0,1,1,0,0,0, "Lorena Pinto", "Normal"],
  [46, 2, "Panamá", "Machetazo", "San Miguelito", "JohnnyCotton", 0,0,0,0,0,0,0,1,1,0,0, "Lorena Pinto", "Normal"],
  [47, 2, "Arraijan", "Machetazo", "Hato Montaña", "JohnnyCotton", 0,0,0,0,0,0,0,0,1,0,0, "Lorena Pinto", "Critico"],
  [48, 2, "Panamá", "Machetazo", "Coronado", "JohnnyCotton", 0,0,0,0,0,0,0,0,1,1,0, "Lorena Pinto", "Normal"],
  [49, 2, "Panamá", "Machetazo", "24 Diciembre", "JohnnyCotton", 0,0,0,0,0,0,0,1,0,0,0, "Lorena Pinto", "Normal"],
  [50, 2, "Coclé", "Machetazo", "Penonomé", "JohnnyCotton", 0,0,0,0,0,0,0,1,0,0,0, "Alcibiades Tenorio", "Normal"],
  [55, 2, "Veraguas", "Amani", "Santiago", "JohnnyCotton", 1,0,0,0,0,0,0,1,0,0,0, "Alcibiades Tenorio", "Normal"],
  [56, 2, "Veraguas", "Punto Mayorista", "Santiago", "JohnnyCotton", 1,0,0,0,0,0,0,1,0,0,0, "Alcibiades Tenorio", "Normal"],
  [57, 1, "Coclé", "Punto Mayorista", "Aguadulce", "JohnnyCotton", 1,0,0,0,0,0,0,1,0,0,0, "Alcibiades Tenorio", "Normal"],
  [58, 1, "Chiriquí", "Punto Poderoso", "David", "JohnnyCotton", 1,0,0,0,0,0,0,1,0,0,0, "Alcibiades Tenorio", "Normal"],
  [59, 1, "Chiriquí", "Shopping Center", "David", "JohnnyCotton", 1,0,0,0,0,0,0,1,1,0,0, "Alcibiades Tenorio", "Normal"],
  [62, 2, "Chiriquí", "City Mall", "David", "JohnnyCotton", 1,0,2,0,0,0,0,1,0,0,0, "Alcibiades Tenorio", "Critico"],
  [63, 2, "Chiriquí", "City Mall", "David", "ChessKing", 0,0,0,0,0,0,0,1,0,0,0, "Alcibiades Tenorio", "Critico"],
  [75, 2, "Coclé", "Jumbo", "Aguadulce", "JohnnyCotton", 1,0,0,0,0,0,1,0,2,0,0, "Alcibiades Tenorio", "Normal"],
  [76, 1, "Panamá", "DDP", "Albrook", "RAFFINE", 0,0,0,0,0,0,0,1,0,0,0, "Lorena Pinto", "Normal"],
  [77, 1, "Panamá", "DDP", "Los Pueblos", "RAFFINE", 0,0,0,0,0,0,0,1,0,0,0, "Lorena Pinto", "Normal"],
  [80, 1, "Panamá", "Saks", "Westland Mall", "RAFFINE", 0,0,0,0,0,0,0,1,0,0,0, "Lorena Pinto", "Normal"],
  [81, 1, "Panamá", "Saks", "Albrook", "RAFFINE", 0,0,0,0,0,0,0,1,0,0,0, "Lorena Pinto", "Normal"],
  [100, 1, "Panamá", "Hiper Rey", "Los Pueblos", "JohnnyCotton", 0,0,0,0,0,0,0,0,0,0,0, "Lorena Pinto", "Desactualizado"],
];

// Insertar PDVs del PDF (actualiza los que ya existen por numeroPdv)
let pdvInserted = 0;
for (const p of pdvInventario) {
  const [num, esp, prov, cadena, zona, marca, cC, rC, gC, cbC, cm, colC, pC, cI, gI, colI, pI, impulsor, estado] = p;

  // Actualizar o insertar PDV
  const sqlPdv = `INSERT INTO puntos_de_venta ("numeroPdv", espacio, pais, provincia, cadena, "mallZona", marca, impulsador, "frecuenciaVisita", estado, "fechaUltimaVisita", "createdAt", "updatedAt")
    VALUES (${num}, ${esp}, 'Panamá', '${esc(prov)}', '${esc(cadena)}', '${esc(zona)}', '${marca}', '${esc(impulsor)}', 1, '${estado}', NULL, NOW(), NOW())
    ON CONFLICT ("numeroPdv") DO UPDATE SET
      espacio=EXCLUDED.espacio, provincia=EXCLUDED.provincia, cadena=EXCLUDED.cadena,
      "mallZona"=EXCLUDED."mallZona", marca=EXCLUDED.marca, impulsador=EXCLUDED.impulsador,
      estado=EXCLUDED.estado, "updatedAt"=NOW()
    RETURNING id`;

  try {
    const rows = await query(sqlPdv);
    const pdvId = rows[0]?.id;

    if (pdvId) {
      // Insertar mobiliario
      const muebles = [
        ["corner", "casual", cC],
        ["rack", "casual", rC],
        ["gondola", "casual", gC],
        ["cabezal", "casual", cbC],
        ["centro_mesa", "casual", cm],
        ["columna", "casual", colC],
        ["pared", "casual", pC],
        ["corner", "interior", cI],
        ["gondola", "interior", gI],
        ["columna", "interior", colI],
        ["pared", "interior", pI],
      ].filter(([, , qty]) => qty > 0);

      for (const [tipo, cat, qty] of muebles) {
        await query(`INSERT INTO mobiliario ("pdvId", tipo, categoria, cantidad, estado, "createdAt", "updatedAt")
          VALUES ('${pdvId}', '${tipo}', '${cat}', ${qty}, '${estado}', NOW(), NOW())`);
      }
    }
    pdvInserted++;
  } catch (e) {
    console.error(`\n  ❌ PDV ${num}: ${e.message}`);
  }
}
console.log(`  ✅ ${pdvInserted} PDVs del PDF con inventario insertados`);

// ─── 4. Verificación final ────────────────────────────────────────────────────
console.log("\n📋 Verificación final...");
const [{ total_pdv }] = await query("SELECT COUNT(*) as total_pdv FROM puntos_de_venta");
const [{ total_mob }] = await query("SELECT COUNT(*) as total_mob FROM mobiliario");
const [{ criticos }] = await query("SELECT COUNT(*) as criticos FROM puntos_de_venta WHERE estado='Critico'");

console.log(`  ✅ puntos_de_venta: ${total_pdv} registros`);
console.log(`  ✅ mobiliario: ${total_mob} piezas registradas`);
console.log(`  ⚠️  PDV Críticos: ${criticos}`);
console.log("\n🎉 Carga completada exitosamente!\n");
