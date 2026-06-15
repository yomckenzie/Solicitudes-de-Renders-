import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const firstOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    ).toISOString();

    const [pdvRes, criticoRes, solicitudRes, visitaRes] = await Promise.all([
      supabaseAdmin.from("puntos_de_venta").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("puntos_de_venta").select("*", { count: "exact", head: true }).eq("estado", "Critico"),
      supabaseAdmin.from("solicitudes_de_render").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("visitas").select("*", { count: "exact", head: true }).gte("createdAt", firstOfMonth),
    ]);

    return NextResponse.json({
      totalPdv: pdvRes.count ?? 0,
      criticos: criticoRes.count ?? 0,
      solicitudesActivas: solicitudRes.count ?? 0,
      visitasMes: visitaRes.count ?? 0,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
