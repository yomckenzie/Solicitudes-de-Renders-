import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { pdvId, tipo, precioMin, precioMax, notas, creadaPor } = body;

    const updates: Record<string, unknown> = {};
    if (pdvId !== undefined) updates.pdvId = pdvId;
    if (tipo !== undefined) {
      const tiposValidos = ["corner", "cabezal", "gondola", "racks", "columna", "pared", "centro_mesa"];
      if (!tiposValidos.includes(tipo)) {
        return NextResponse.json(
          { error: `Tipo inválido. Debe ser uno de: ${tiposValidos.join(", ")}` },
          { status: 400 }
        );
      }
      updates.tipo = tipo;
    }
    if (precioMin !== undefined) {
      updates.precioMin = precioMin === null || precioMin === "" ? null : Number(precioMin);
    }
    if (precioMax !== undefined) {
      updates.precioMax = precioMax === null || precioMax === "" ? null : Number(precioMax);
    }
    if (notas !== undefined) updates.notas = notas || null;
    if (creadaPor !== undefined) updates.creadaPor = creadaPor;

    const { data, error } = await supabaseAdmin
      .from("cotizaciones")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { error } = await supabaseAdmin.from("cotizaciones").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
