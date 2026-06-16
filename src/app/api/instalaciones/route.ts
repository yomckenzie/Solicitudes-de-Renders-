import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const solicitudId = searchParams.get("solicitudId");

  try {
    let query = supabaseAdmin
      .from("instalaciones")
      .select(`
        id, "solicitudId", "fechasPropuestas", "fechaConfirmada",
        "visitaRealizada", notas, "createdAt",
        solicitudes_de_render(
          id, marca, estado,
          puntos_de_venta(numeroPdv, cadena, mallZona, provincia)
        )
      `)
      .order("createdAt", { ascending: false });

    if (solicitudId) query = query.eq("solicitudId", solicitudId);

    const { data, error } = await query;

    if (error) {
      if (error.code === "42P01") {
        return NextResponse.json({ needsSetup: true, data: [] });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data ?? [] });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { solicitudId, fechasPropuestas, fechaConfirmada, visitaRealizada, notas } = body;

    if (!solicitudId) {
      return NextResponse.json(
        { error: "Falta campo requerido: solicitudId" },
        { status: 400 }
      );
    }

    if (!Array.isArray(fechasPropuestas) || fechasPropuestas.length === 0) {
      return NextResponse.json(
        { error: "Debe proponer al menos una fecha" },
        { status: 400 }
      );
    }

    // Normalizar fechas: aceptar strings ISO yyyy-mm-dd
    const fechasNormalizadas = fechasPropuestas
      .map((f: unknown) => (typeof f === "string" ? f.trim() : ""))
      .filter((f: string) => f.length > 0);

    if (fechasNormalizadas.length === 0) {
      return NextResponse.json(
        { error: "Debe proponer al menos una fecha válida" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("instalaciones")
      .insert({
        solicitudId,
        fechasPropuestas: fechasNormalizadas,
        fechaConfirmada: fechaConfirmada || null,
        visitaRealizada: Boolean(visitaRealizada),
        notas: notas || null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "42P01") {
        return NextResponse.json({ needsSetup: true }, { status: 503 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ data }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
