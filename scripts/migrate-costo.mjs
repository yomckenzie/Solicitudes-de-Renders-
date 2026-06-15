import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const projectRef = SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
if (!projectRef || !ACCESS_TOKEN) {
  console.error("Faltan SUPABASE_ACCESS_TOKEN o NEXT_PUBLIC_SUPABASE_URL");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, supabaseKey);

async function runSql(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  return json;
}

const costosPorTipo = {
  corner:      [1200, 3500],
  gondola:     [800,  2500],
  rack:        [400,  1200],
  cabezal:     [300,  900],
  columna:     [200,  700],
  pared:       [300,  1000],
  centro_mesa: [200,  600],
};

async function main() {
  console.log("🏗️  Agregando columna costoAdquisicion...");
  await runSql(`ALTER TABLE mobiliario ADD COLUMN IF NOT EXISTS "costoAdquisicion" DECIMAL(10,2);`);
  console.log("✓ Columna agregada");

  const { data: muebles, error } = await supabase.from("mobiliario").select("id, tipo");
  if (error) throw error;
  console.log(`📦 Actualizando ${muebles.length} muebles con costos...`);

  for (const m of muebles) {
    const [min, max] = costosPorTipo[m.tipo] || [500, 2000];
    const costo = Math.round((Math.random() * (max - min) + min) * 100) / 100;
    const { error: e } = await supabase.from("mobiliario").update({ costoAdquisicion: costo }).eq("id", m.id);
    if (e) console.error(`  ✗ ${m.id}:`, e.message);
    else console.log(`  ✓ ${m.tipo.padEnd(12)} → $${costo.toLocaleString()}`);
  }

  console.log("\n✅ Migración completa");
}

main().catch(e => { console.error("Error:", e); process.exit(1); });
