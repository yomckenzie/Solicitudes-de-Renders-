import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [solRes, tareasRes, rendersRes, cotizRes, pagosRes, instRes, visitasRes] = await Promise.all([
      supabaseAdmin
        .from("solicitudes_de_render")
        .select(`*, puntos_de_venta(*), usuarios(nombre, email, rol)`)
        .eq("id", id)
        .single(),
      supabaseAdmin.from("tareas").select("*").eq("solicitudId", id).order("createdAt", { ascending: false }),
      supabaseAdmin.from("renders").select("*").eq("solicitudId", id).order("createdAt", { ascending: false }),
      supabaseAdmin.from("cotizaciones").select("*").eq("solicitudId", id).order("createdAt", { ascending: false }),
      supabaseAdmin.from("pagos").select("*").eq("solicitudId", id).order("fecha", { ascending: false }),
      supabaseAdmin.from("instalaciones").select("*").eq("solicitudId", id).single(),
      // visitas del PDV para contexto
      supabaseAdmin
        .from("visitas")
        .select("id, fecha, estadoEspacio, observacion, usuarios(nombre)")
        .order("fecha", { ascending: false })
        .limit(5),
    ]);

    if (solRes.error || !solRes.data) {
      return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 });
    }

    const sol = solRes.data;

    // Filtrar visitas del PDV de esta solicitud
    let visitas: unknown[] = [];
    if (sol.pdvId) {
      const { data: v } = await supabaseAdmin
        .from("visitas")
        .select("id, fecha, estadoEspacio, observacion, usuarios(nombre)")
        .eq("pdvId", sol.pdvId)
        .order("fecha", { ascending: false })
        .limit(5);
      visitas = v || [];
    }

    return NextResponse.json({
      solicitud: sol,
      tareas: tareasRes.data || [],
      renders: rendersRes.data || [],
      cotizaciones: cotizRes.data || [],
      pagos: pagosRes.data || [],
      instalacion: instRes.data || null,
      visitas,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
