import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tipo = searchParams.get("tipo");
  const pdvId = searchParams.get("pdvId");

  try {
    let query = supabaseAdmin
      .from("cotizaciones")
      .select(`
        id, "pdvId", tipo, "precioMin", "precioMax", notas, "creadaPor", "createdAt",
        puntos_de_venta(numeroPdv, cadena, mallZona, provincia)
      `)
      .order("createdAt", { ascending: false });

    if (tipo) query = query.eq("tipo", tipo);
    if (pdvId) query = query.eq("pdvId", pdvId);

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
    const { pdvId, tipo, precioMin, precioMax, notas, creadaPor } = body;

    if (!pdvId || !tipo) {
      return NextResponse.json({ error: "Faltan campos requeridos: pdvId, tipo" }, { status: 400 });
    }

    const tiposValidos = ["corner", "cabezal", "gondola", "racks", "columna", "pared", "centro_mesa"];
    if (!tiposValidos.includes(tipo)) {
      return NextResponse.json(
        { error: `Tipo inválido. Debe ser uno de: ${tiposValidos.join(", ")}` },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("cotizaciones")
      .insert({
        pdvId,
        tipo,
        precioMin: precioMin !== undefined && precioMin !== null && precioMin !== "" ? Number(precioMin) : null,
        precioMax: precioMax !== undefined && precioMax !== null && precioMax !== "" ? Number(precioMax) : null,
        notas: notas || null,
        creadaPor: creadaPor || "Ventas",
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
