/**
 * Script para crear/actualizar un usuario en Supabase con password hasheado.
 *
 * Uso:
 *   npx ts-node scripts/create-user.ts <email> <password> <nombre> <rol>
 *
 * Ejemplo:
 *   npx ts-node scripts/create-user.ts admin@jc.com Panama2026! "Admin Principal" admin
 *
 * Roles válidos: admin, ventas, aprobador, coordinadora, disenador,
 *                mercadeo, proveedor, impulsador, contabilidad
 */

import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

const [, , email, password, nombre, rol] = process.argv;

const VALID_ROLES = [
  "admin",
  "ventas",
  "aprobador",
  "coordinadora",
  "disenador",
  "mercadeo",
  "proveedor",
  "impulsador",
  "contabilidad",
];

async function main() {
  if (!email || !password || !nombre || !rol) {
    console.error("Faltan argumentos. Uso:");
    console.error("  npx ts-node scripts/create-user.ts <email> <password> <nombre> <rol>");
    process.exit(1);
  }

  if (!VALID_ROLES.includes(rol)) {
    console.error(`Rol inválido. Roles válidos: ${VALID_ROLES.join(", ")}`);
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Faltan variables NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const hashed = await bcrypt.hash(password, 10);

  const { data, error } = await supabase
    .from("usuarios")
    .upsert(
      {
        email: email.toLowerCase().trim(),
        password: hashed,
        nombre,
        rol,
        activo: true,
      },
      { onConflict: "email" }
    )
    .select()
    .single();

  if (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }

  console.log("Usuario creado/actualizado:");
  console.log(`  id:     ${data.id}`);
  console.log(`  email:  ${data.email}`);
  console.log(`  nombre: ${data.nombre}`);
  console.log(`  rol:    ${data.rol}`);
  console.log(`  activo: ${data.activo}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
