import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(_req: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from("visitas")
      .select(`
        id, pdvId, fecha, observacion, estadoEspacio,
        puntos_de_venta(numeroPdv, cadena, mallZona, provincia),
        usuarios(nombre)
      `)
      .order("fecha", { ascending: false });

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

    const { data: pdv, error: pdvErr } = await supabaseAdmin
      .from("puntos_de_venta")
      .select("id")
      .eq("numeroPdv", Number(pdvNumero))
      .single();

    if (pdvErr || !pdv) {
      return NextResponse.json({ error: `PDV-${pdvNumero} no encontrado` }, { status: 404 });
    }

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
        pdvId: pdv.id,
        impulsadorId: usuario.id,
        fecha: fecha || new Date().toISOString(),
        estadoEspacio: estadoEspacio || "Normal",
        observacion: observacion || null,
      })
      .select(`
        id, pdvId, fecha, observacion, estadoEspacio,
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
