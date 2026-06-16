import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { fechasPropuestas, fechaConfirmada, visitaRealizada, notas } = body;

    const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };

    if (fechasPropuestas !== undefined) {
      if (!Array.isArray(fechasPropuestas)) {
        return NextResponse.json(
          { error: "fechasPropuestas debe ser un arreglo" },
          { status: 400 }
        );
      }
      const normalizadas = fechasPropuestas
        .map((f: unknown) => (typeof f === "string" ? f.trim() : ""))
        .filter((f: string) => f.length > 0);
      if (normalizadas.length === 0) {
        return NextResponse.json(
          { error: "Debe quedar al menos una fecha propuesta" },
          { status: 400 }
        );
      }
      updates.fechasPropuestas = normalizadas;
    }

    if (fechaConfirmada !== undefined) {
      updates.fechaConfirmada = fechaConfirmada || null;
    }

    if (visitaRealizada !== undefined) {
      updates.visitaRealizada = Boolean(visitaRealizada);
    }

    if (notas !== undefined) {
      updates.notas = notas || null;
    }

    const { data, error } = await supabaseAdmin
      .from("instalaciones")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "42P01") {
        return NextResponse.json({ needsSetup: true }, { status: 503 });
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
    const { error } = await supabaseAdmin
      .from("instalaciones")
      .delete()
      .eq("id", id);

    if (error) {
      if (error.code === "42P01") {
        return NextResponse.json({ needsSetup: true }, { status: 503 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
