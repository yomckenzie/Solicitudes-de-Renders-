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

    // Obtener última visita
    const { data: ultimaVisita, error: visitErr } = await supabaseAdmin
      .from("visitas")
      .select("id, fecha, observacion, estadoEspacio, usuarios(nombre)")
      .eq("pdvId", id)
      .order("fecha", { ascending: false })
      .limit(1)
      .single();

    // Obtener solicitudes activas/recientes
    const { data: solicitudes, error: solErr } = await supabaseAdmin
      .from("solicitudes_de_render")
      .select("id, tipo, estado, marca, createdAt")
      .eq("pdvId", id)
      .order("createdAt", { ascending: false })
      .limit(5);

    // Obtener cotizaciones (para costos)
    const { data: cotizaciones, error: cotErr } = await supabaseAdmin
      .from("solicitudes_de_render")
      .select("id, cotizacion(precioMin, precioMax)")
      .eq("pdvId", id)
      .not("cotizacion", "is", null);

    // Obtener pagos (para saber cuánto se gastó)
    const { data: pagos, error: pagErr } = await supabaseAdmin
      .from("solicitudes_de_render")
      .select("id, pago(monto, fecha)")
      .eq("pdvId", id)
      .not("pago", "is", null);

    return NextResponse.json({
      pdv,
      mobiliarios: mobiliarios || [],
      ultimaVisita: ultimaVisita || null,
      solicitudes: solicitudes || [],
      cotizaciones: cotizaciones || [],
      pagos: pagos || [],
      totalMobiliarios: mobiliarios?.length ?? 0,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
