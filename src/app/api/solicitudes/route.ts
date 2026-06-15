import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const estado = searchParams.get("estado");
  const tipo = searchParams.get("tipo");
  const q = searchParams.get("q");

  try {
    let query = supabaseAdmin
      .from("solicitudes_de_render")
      .select(`
        id, tipo, estado, marca, notas, createdAt,
        puntos_de_venta(numeroPdv, cadena, mallZona, provincia),
        usuarios(nombre, rol)
      `, { count: "exact" });

    if (estado) query = query.eq("estado", estado);
    if (tipo) query = query.eq("tipo", tipo);

    const { data, count, error } = await query.order("createdAt", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Filtro por texto del PDV
    const filtered = q
      ? (data ?? []).filter((s: Record<string, unknown>) => {
          const pdv = s.puntos_de_venta as Record<string, unknown> | null;
          return (
            String(pdv?.cadena ?? "").toLowerCase().includes(q.toLowerCase()) ||
            String(pdv?.mallZona ?? "").toLowerCase().includes(q.toLowerCase()) ||
            String(s.notas ?? "").toLowerCase().includes(q.toLowerCase())
          );
        })
      : data;

    return NextResponse.json({ data: filtered, total: q ? filtered?.length : count });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { tipo, pdvNumero, marca, notas, creadoPorNombre } = await req.json();

    if (!tipo || !pdvNumero || !marca) {
      return NextResponse.json({ error: "Faltan campos: tipo, pdvNumero, marca" }, { status: 400 });
    }

    // Buscar PDV
    const { data: pdv, error: pdvErr } = await supabaseAdmin
      .from("puntos_de_venta")
      .select("id")
      .eq("numeroPdv", Number(pdvNumero))
      .limit(1)
      .single();

    if (pdvErr || !pdv) {
      return NextResponse.json({ error: `PDV-${pdvNumero} no encontrado` }, { status: 404 });
    }

    // Buscar o usar usuario Ventas por defecto
    const nombre = creadoPorNombre || "Ventas";
    const { data: usuario } = await supabaseAdmin
      .from("usuarios")
      .select("id")
      .eq("nombre", nombre)
      .single();

    const userId = usuario?.id;
    if (!userId) {
      return NextResponse.json({ error: `Usuario "${nombre}" no encontrado` }, { status: 404 });
    }

    const { data, error } = await supabaseAdmin
      .from("solicitudes_de_render")
      .insert({
        tipo,
        estado: "BORRADOR",
        pdvId: pdv.id,
        marca,
        creadoPorId: userId,
        notas: notas || null,
        updatedAt: new Date().toISOString(),
      })
      .select(`
        id, tipo, estado, marca, notas, createdAt,
        puntos_de_venta(numeroPdv, cadena, mallZona),
        usuarios(nombre)
      `)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
