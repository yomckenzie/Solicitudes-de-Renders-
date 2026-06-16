import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const solicitudId = searchParams.get("solicitudId");

  try {
    let query = supabaseAdmin
      .from("pagos")
      .select(`
        id, solicitudId, monto, porcentaje, registradoPor, fecha, createdAt,
        solicitudes_de_render(
          id, tipo, estado, marca, marca,
          puntos_de_venta(numeroPdv, cadena, mallZona)
        )
      `)
      .order("fecha", { ascending: false });

    if (solicitudId) query = query.eq("solicitudId", solicitudId);

    const { data, error } = await query;

    if (error) {
      if (error.code === "42P01") {
        return NextResponse.json({ needsSetup: true, data: [] });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { solicitudId, monto, porcentaje, registradoPor, fecha } = body;

    if (!solicitudId || monto === undefined || monto === null || porcentaje === undefined || porcentaje === null || !registradoPor) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: solicitudId, monto, porcentaje, registradoPor" },
        { status: 400 }
      );
    }

    if (Number(monto) <= 0) {
      return NextResponse.json({ error: "El monto debe ser mayor a 0" }, { status: 400 });
    }

    if (Number(porcentaje) <= 0 || Number(porcentaje) > 100) {
      return NextResponse.json({ error: "El porcentaje debe estar entre 1 y 100" }, { status: 400 });
    }

    // Verificar que la solicitud existe
    const { data: solicitud, error: solErr } = await supabaseAdmin
      .from("solicitudes_de_render")
      .select("id")
      .eq("id", solicitudId)
      .single();

    if (solErr || !solicitud) {
      return NextResponse.json({ error: `Solicitud ${solicitudId} no encontrada` }, { status: 404 });
    }

    const { data, error } = await supabaseAdmin
      .from("pagos")
      .insert({
        solicitudId,
        monto: Number(monto),
        porcentaje: Number(porcentaje),
        registradoPor,
        fecha: fecha || new Date().toISOString().split("T")[0],
      })
      .select(`
        id, solicitudId, monto, porcentaje, registradoPor, fecha, createdAt,
        solicitudes_de_render(
          id, tipo, estado, marca,
          puntos_de_venta(numeroPdv, cadena, mallZona)
        )
      `)
      .single();

    if (error) {
      if (error.code === "42P01") {
        return NextResponse.json({ needsSetup: true, error: "La tabla 'pagos' no existe" }, { status: 503 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ data }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
