import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  _req: any,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Obtener datos del PDV
    const { data: pdv, error: pdvErr } = await supabaseAdmin
      .from("puntos_de_venta")
      .select("*")
      .eq("id", id)
      .single();

    if (pdvErr || !pdv) {
      return NextResponse.json({ error: "PDV no encontrado" }, { status: 404 });
    }

    // Obtener mobiliarios del PDV
    const { data: mobiliarios, error: mobErr } = await supabaseAdmin
      .from("mobiliario")
      .select("*")
      .eq("pdvId", id);

    if (mobErr) {
      return NextResponse.json({ error: mobErr.message }, { status: 500 });
    }

    const [visitasRes, solicitudesRes] = await Promise.all([
      supabaseAdmin
        .from("visitas")
        .select("id, fecha, observacion, estadoEspacio, fotos, usuarios(nombre)")
        .eq("pdvId", id)
        .order("fecha", { ascending: false })
        .limit(10),
      supabaseAdmin
        .from("solicitudes_de_render")
        .select("id, tipo, estado, marca, notas, createdAt")
        .eq("pdvId", id)
        .order("createdAt", { ascending: false })
        .limit(10),
    ]);

    const visitas = visitasRes.data || [];
    const ultimaVisita = visitas[0] ?? null;
    const solicitudes = solicitudesRes.data || [];

    return NextResponse.json({
      pdv,
      mobiliarios: mobiliarios || [],
      ultimaVisita,
      visitas,
      solicitudes,
      cotizaciones: [],
      pagos: [],
      totalMobiliarios: mobiliarios?.length ?? 0,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
