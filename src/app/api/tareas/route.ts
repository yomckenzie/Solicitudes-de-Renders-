import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { canCreateTarea, getAssignableNames } from "@/lib/roles";

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
    const user = await canCreateTarea();
    if (!user) {
      return NextResponse.json(
        { error: "No tienes permiso para crear tareas. Solo coordinadoras o administradores pueden asignar tareas." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { titulo, descripcion, asignadaA, prioridad, fechaLimite, solicitudId, pdvId } = body;

    if (!titulo) {
      return NextResponse.json({ error: "Faltan campos requeridos: titulo" }, { status: 400 });
    }
    if (!pdvId) {
      return NextResponse.json({ error: "Faltan campos requeridos: pdvId (la tarea debe estar vinculada a un punto de venta)" }, { status: 400 });
    }

    // Admin puede asignar a cualquier usuario activo; coordinadora solo a diseñadores.
    const asignables = await getAssignableNames(user);
    if (asignables.length === 0) {
      return NextResponse.json(
        { error: "No hay usuarios disponibles para asignar la tarea." },
        { status: 409 }
      );
    }
    if (asignadaA && !asignables.includes(asignadaA)) {
      return NextResponse.json(
        { error: `Asignado inválido: "${asignadaA}". Permitidos: ${asignables.join(", ")}.` },
        { status: 400 }
      );
    }
    const asignadaFinal = asignadaA || asignables[0];

    // El creador SIEMPRE es el usuario autenticado (no confiamos en el cliente)
    const creadorFinal = user.name;

    const { data, error } = await supabaseAdmin
      .from("tareas")
      .insert({
        titulo,
        descripcion: descripcion || null,
        asignadaA: asignadaFinal,
        creadaPor: creadorFinal,
        prioridad: prioridad || "Media",
        fechaLimite: fechaLimite || null,
        solicitudId: solicitudId || null,
        pdvId: pdvId || null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
