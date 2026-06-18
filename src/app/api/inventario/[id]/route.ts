import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updates: Record<string, unknown> = {};
    if ("medidas" in body) updates.medidas = body.medidas;
    if ("estado" in body) updates.estado = body.estado;
    if ("cantidad" in body) updates.cantidad = Number(body.cantidad);
    if ("imagenes" in body) updates.imagenes = body.imagenes;
    if ("propiedad" in body) updates.propiedad = body.propiedad;
    if ("material" in body) updates.material = body.material;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No hay campos para actualizar" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("mobiliario")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      // Si fallan las columnas nuevas, reintentar sin ellas y señalar que hay que crearlas
      if (error.message.includes("propiedad") || error.message.includes("material")) {
        delete updates.propiedad;
        delete updates.material;
        const { data: data2, error: err2 } = await supabaseAdmin
          .from("mobiliario").update(updates).eq("id", id).select().single();
        if (err2) return NextResponse.json({ error: err2.message }, { status: 500 });
        return NextResponse.json({ data: data2, needsColumns: true });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { error } = await supabaseAdmin.from("mobiliario").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
