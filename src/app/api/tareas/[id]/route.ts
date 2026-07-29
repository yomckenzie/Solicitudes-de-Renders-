import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { canCreateTarea, getAssignableNames } from "@/lib/roles";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { estado, titulo, descripcion, prioridad, fechaLimite, pdvId, asignadaA } = body;

    // Solo coordinadoras/admin pueden cambiar la asignación o editar contenido.
    // Cambiar de estado (Pendiente → En Progreso → Completada) lo puede hacer
    // cualquier persona con rol permitido para acceder al módulo.
    const isReassignment = asignadaA !== undefined;
    const isContentEdit = titulo !== undefined || descripcion !== undefined || prioridad !== undefined || fechaLimite !== undefined || pdvId !== undefined;

    if (isReassignment || isContentEdit) {
      const user = await canCreateTarea();
      if (!user) {
        return NextResponse.json(
          { error: "No tienes permiso para modificar tareas. Solo coordinadoras o administradores." },
          { status: 403 }
        );
      }

      // Admin reasigna a cualquier usuario activo; coordinadora solo a diseñadores.
      if (isReassignment) {
        const asignables = await getAssignableNames(user);
        if (!asignables.includes(asignadaA)) {
          return NextResponse.json(
            { error: `Asignado inválido: "${asignadaA}". Permitidos: ${asignables.join(", ")}.` },
            { status: 400 }
          );
        }
      }
    }

    const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (estado !== undefined) updates.estado = estado;
    if (titulo !== undefined) updates.titulo = titulo;
    if (descripcion !== undefined) updates.descripcion = descripcion;
    if (prioridad !== undefined) updates.prioridad = prioridad;
    if (fechaLimite !== undefined) updates.fechaLimite = fechaLimite;
    if (pdvId !== undefined) updates.pdvId = pdvId || null;
    if (asignadaA !== undefined) updates.asignadaA = asignadaA;

    const { data, error } = await supabaseAdmin
      .from("tareas")
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
    const user = await canCreateTarea();
    if (!user) {
      return NextResponse.json(
        { error: "No tienes permiso para eliminar tareas. Solo coordinadoras o administradores." },
        { status: 403 }
      );
    }
    const { error } = await supabaseAdmin.from("tareas").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
