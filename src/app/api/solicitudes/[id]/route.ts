import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { estado } = await req.json();

    if (!estado) {
      return NextResponse.json({ error: "Falta campo: estado" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("solicitudes_de_render")
      .update({ estado })
      .eq("id", id)
      .select(`
        id, tipo, estado, marca, notas, created_at,
        puntos_de_venta(numero_pdv, cadena, mall_zona),
        usuarios(nombre)
      `)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
