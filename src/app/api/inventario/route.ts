import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tipo = searchParams.get("tipo");
  const categoria = searchParams.get("categoria");
  const estado = searchParams.get("estado");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const pageSize = 50;

  try {
    let query = supabaseAdmin
      .from("mobiliario")
      .select(`id, tipo, categoria, cantidad, medidas, estado, createdAt, puntos_de_venta(numeroPdv, cadena, mallZona, marca, provincia)`, { count: "exact" });

    if (tipo) query = query.eq("tipo", tipo);
    if (categoria) query = query.eq("categoria", categoria);
    if (estado) query = query.eq("estado", estado);

    const { data, count, error } = await query
      .order("createdAt", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data, total: count ?? 0, page, pageSize });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { pdvNumero, tipo, categoria, cantidad, medidas, estado } = await req.json();

    if (!pdvNumero || !tipo || !categoria) {
      return NextResponse.json({ error: "Faltan campos: pdvNumero, tipo, categoria" }, { status: 400 });
    }

    // Buscar el PDV por número
    const { data: pdv, error: pdvError } = await supabaseAdmin
      .from("puntos_de_venta")
      .select("id")
      .eq("numeroPdv", pdvNumero)
      .single();

    if (pdvError || !pdv) {
      return NextResponse.json({ error: `PDV-${pdvNumero} no encontrado` }, { status: 404 });
    }

    const { data, error } = await supabaseAdmin
      .from("mobiliario")
      .insert({
        pdvId: pdv.id,
        tipo,
        categoria,
        cantidad: Number(cantidad) || 1,
        medidas: medidas || null,
        estado: estado || "Normal",
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
