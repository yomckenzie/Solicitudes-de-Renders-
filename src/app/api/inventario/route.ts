import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tipo = searchParams.get("tipo");
  const categoria = searchParams.get("categoria");
  const estado = searchParams.get("estado");
  const marca = searchParams.get("marca");
  const cadena = searchParams.get("cadena");
  const provincia = searchParams.get("provincia");
  const q = searchParams.get("q");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const pageSize = 50;

  // Usar INNER JOIN cuando hay filtros de PDV para excluir muebles sin PDV coincidente
  const needsPdvFilter = !!(marca || cadena || provincia || q);
  const joinType = needsPdvFilter ? "puntos_de_venta!inner" : "puntos_de_venta";
  const selectStr = `id, pdvId, tipo, categoria, cantidad, medidas, estado, createdAt, ${joinType}(numeroPdv, cadena, mallZona, marca, provincia)`;

  try {
    let query = supabaseAdmin
      .from("mobiliario")
      .select(selectStr, { count: "exact" });

    if (tipo) query = query.eq("tipo", tipo);
    if (categoria) query = query.eq("categoria", categoria);
    if (estado) query = query.eq("estado", estado);
    if (marca) query = query.eq("puntos_de_venta.marca", marca);
    if (cadena) query = query.ilike("puntos_de_venta.cadena", `%${cadena}%`);
    if (provincia) query = query.eq("puntos_de_venta.provincia", provincia);
    if (q) query = query.or(`cadena.ilike.%${q}%,mallZona.ilike.%${q}%`, { referencedTable: "puntos_de_venta" });

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
    const { pdvNumero, pdvId: pdvIdDirect, tipo, categoria, cantidad, medidas, estado } = await req.json();

    if ((!pdvNumero && !pdvIdDirect) || !tipo || !categoria) {
      return NextResponse.json({ error: "Faltan campos: pdvNumero (o pdvId), tipo, categoria" }, { status: 400 });
    }

    let resolvedPdvId: string | null = pdvIdDirect ?? null;

    if (!resolvedPdvId) {
      const { data: pdv, error: pdvError } = await supabaseAdmin
        .from("puntos_de_venta")
        .select("id")
        .eq("numeroPdv", pdvNumero)
        .single();

      if (pdvError || !pdv) {
        return NextResponse.json({ error: `PDV-${pdvNumero} no encontrado` }, { status: 404 });
      }
      resolvedPdvId = pdv.id;
    }

    const { data, error } = await supabaseAdmin
      .from("mobiliario")
      .insert({
        pdvId: resolvedPdvId,
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
