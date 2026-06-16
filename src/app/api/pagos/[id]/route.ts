import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { solicitudId, monto, porcentaje, registradoPor, fecha } = body;

    const updates: Record<string, unknown> = {};
    if (solicitudId !== undefined) updates.solicitudId = solicitudId;
    if (monto !== undefined) {
      if (Number(monto) <= 0) {
        return NextResponse.json({ error: "El monto debe ser mayor a 0" }, { status: 400 });
      }
      updates.monto = Number(monto);
    }
    if (porcentaje !== undefined) {
      if (Number(porcentaje) <= 0 || Number(porcentaje) > 100) {
        return NextResponse.json({ error: "El porcentaje debe estar entre 1 y 100" }, { status: 400 });
      }
      updates.porcentaje = Number(porcentaje);
    }
    if (registradoPor !== undefined) updates.registradoPor = registradoPor;
    if (fecha !== undefined) updates.fecha = fecha;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No hay campos para actualizar" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("pagos")
      .update(updates)
      .eq("id", id)
      .select(`
        id, solicitudId, monto, porcentaje, registradoPor, fecha, createdAt,
        solicitudes_de_render(
          id, tipo, estado, marca,
          puntos_de_venta(numeroPdv, cadena, mallZona)
        )
      `)
      .single();

    if (error) {
      if (error.code === "42P01") {
        return NextResponse.json({ needsSetup: true, error: "La tabla 'pagos' no existe" }, { status: 503 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
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
    const { error } = await supabaseAdmin.from("pagos").delete().eq("id", id);
    if (error) {
      if (error.code === "42P01") {
        return NextResponse.json({ needsSetup: true, error: "La tabla 'pagos' no existe" }, { status: 503 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
