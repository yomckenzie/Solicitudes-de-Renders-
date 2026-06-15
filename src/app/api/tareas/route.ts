import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("tareas")
      .select("*")
      .order("createdAt", { ascending: false });

    if (error) {
      if (error.code === "42P01") {
        return NextResponse.json({ needsSetup: true, data: [] });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { titulo, descripcion, asignadaA, creadaPor, prioridad, fechaLimite, solicitudId } = body;

    if (!titulo || !creadaPor) {
      return NextResponse.json({ error: "Faltan campos requeridos: titulo, creadaPor" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("tareas")
      .insert({
        titulo,
        descripcion: descripcion || null,
        asignadaA: asignadaA || "Yovanni",
        creadaPor,
        prioridad: prioridad || "Media",
        fechaLimite: fechaLimite || null,
        solicitudId: solicitudId || null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
