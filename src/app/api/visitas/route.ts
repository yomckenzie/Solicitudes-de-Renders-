import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const impulsador = searchParams.get("impulsador");

  try {
    let query = supabaseAdmin
      .from("visitas")
      .select(`
        id, fecha, observacion, estado_espacio,
        puntos_de_venta(numero_pdv, cadena, mall_zona, provincia),
        usuarios(nombre)
      `);

    if (impulsador) query = query.eq("usuarios.nombre", impulsador);

    const { data, error } = await query.order("fecha", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { pdvNumero, impulsadorNombre, fecha, estadoEspacio, observacion } = await req.json();

    if (!pdvNumero || !impulsadorNombre) {
      return NextResponse.json({ error: "Faltan campos: pdvNumero, impulsadorNombre" }, { status: 400 });
    }

    // Buscar PDV
    const { data: pdv, error: pdvErr } = await supabaseAdmin
      .from("puntos_de_venta")
      .select("id")
      .eq("numero_pdv", Number(pdvNumero))
      .single();

    if (pdvErr || !pdv) {
      return NextResponse.json({ error: `PDV-${pdvNumero} no encontrado` }, { status: 404 });
    }

    // Buscar usuario (impulsador)
    const { data: usuario, error: userErr } = await supabaseAdmin
      .from("usuarios")
      .select("id")
      .eq("nombre", impulsadorNombre)
      .single();

    if (userErr || !usuario) {
      return NextResponse.json({ error: `Impulsador "${impulsadorNombre}" no encontrado` }, { status: 404 });
    }

    const { data, error } = await supabaseAdmin
      .from("visitas")
      .insert({
        pdv_id: pdv.id,
        impulsador_id: usuario.id,
        fecha: fecha || new Date().toISOString(),
        estado_espacio: estadoEspacio || "Normal",
        observacion: observacion || null,
      })
      .select(`
        id, fecha, observacion, estado_espacio,
        puntos_de_venta(numero_pdv, cadena, mall_zona),
        usuarios(nombre)
      `)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
