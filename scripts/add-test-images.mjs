import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Faltan variables de entorno");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Imágenes de prueba por tipo de mueble
const testImages = {
  corner: [
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=400&fit=crop",
  ],
  gondola: [
    "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1530123496345-f8202ccb1570?w=400&h=400&fit=crop",
  ],
  rack: [
    "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1506368299235-c7f7b85ee67b?w=400&h=400&fit=crop",
  ],
  cabezal: [
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop",
  ],
  columna: [
    "https://images.unsplash.com/photo-1572520573408-2c1d5b42dc08?w=400&h=400&fit=crop",
  ],
  pared: [
    "https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=400&h=400&fit=crop",
  ],
  centro_mesa: [
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=400&fit=crop",
  ],
};

async function addTestImages() {
  console.log("📸 Agregando fotos de prueba a mobiliarios...");

  // Obtener los primeros 20 mobiliarios
  const { data: mobiliarios, error } = await supabase
    .from("mobiliario")
    .select("id, tipo")
    .limit(20);

  if (error) {
    console.error("❌ Error al obtener mobiliarios:", error.message);
    return;
  }

  console.log(`✓ Se encontraron ${mobiliarios.length} mobiliarios`);

  let updated = 0;

  for (const m of mobiliarios) {
    const images = testImages[m.tipo] || testImages.corner;
    const imagenesToAdd = images.slice(0, 2);

    const { error: updateError } = await supabase
      .from("mobiliario")
      .update({ imagenes: imagenesToAdd })
      .eq("id", m.id);

    if (updateError) {
      console.error(`❌ Error actualizando ${m.id}:`, updateError.message);
    } else {
      updated++;
      console.log(`✓ ${m.tipo} (${m.id}) — ${imagenesToAdd.length} fotos agregadas`);
    }
  }

  console.log(`\n✅ Actualizado ${updated} de ${mobiliarios.length} mobiliarios`);
}

addTestImages().catch(console.error);
