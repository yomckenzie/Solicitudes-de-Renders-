import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { aprobadoMercadeo, aprobadoCliente, notas } = body;

    const updates: Record<string, unknown> = {};
    if (aprobadoMercadeo !== undefined) updates.aprobadoMercadeo = !!aprobadoMercadeo;
    if (aprobadoCliente !== undefined) updates.aprobadoCliente = !!aprobadoCliente;
    if (notas !== undefined) updates.notas = notas;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No hay campos para actualizar" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("renders")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "42P01") {
        return NextResponse.json({ needsSetup: true });
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
    const { error } = await supabaseAdmin.from("renders").delete().eq("id", id);
    if (error) {
      if (error.code === "42P01") {
        return NextResponse.json({ needsSetup: true });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
