import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const solicitudId = searchParams.get("solicitudId");

    let query = supabaseAdmin
      .from("renders")
      .select("*")
      .order("createdAt", { ascending: false });

    if (solicitudId) query = query.eq("solicitudId", solicitudId);

    const { data, error } = await query;

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
    const contentType = req.headers.get("content-type") ?? "";

    // Acepta JSON (recomendado: cliente sube el archivo a /api/upload y luego
    // nos manda la URL) o multipart/form-data con archivo embebido.
    let body: Record<string, unknown> = {};
    let file: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      file = formData.get("file") as File | null;
      body.solicitudId = formData.get("solicitudId");
      body.archivoUrl = formData.get("archivoUrl");
      body.subidoPor = formData.get("subidoPor");
      body.notas = formData.get("notas");
      body.version = formData.get("version");
    } else {
      body = await req.json();
    }

    const solicitudId = body.solicitudId as string | undefined;
    let archivoUrl = body.archivoUrl as string | undefined;
    const subidoPor = (body.subidoPor as string | undefined) ?? "Yovanni";
    const notas = (body.notas as string | undefined) ?? null;

    if (!solicitudId) {
      return NextResponse.json(
        { error: "Falta campo requerido: solicitudId" },
        { status: 400 }
      );
    }

    // Si el cliente mandó el archivo directamente (multipart), súbelo a Supabase
    // Storage usando el endpoint existente /api/upload internamente (mismo
    // cliente admin). En el flujo normal el cliente ya subió y solo manda URL.
    if (!archivoUrl && file) {
      const buffer = await file.arrayBuffer();
      const filename = `renders/${Date.now()}-${file.name}`;
      const { data: upload, error: upErr } = await supabaseAdmin.storage
        .from("photos")
        .upload(filename, buffer, {
          contentType: file.type,
          upsert: false,
        });
      if (upErr) {
        return NextResponse.json(
          { error: `Error subiendo archivo: ${upErr.message}` },
          { status: 500 }
        );
      }
      const { data: pub } = supabaseAdmin.storage
        .from("photos")
        .getPublicUrl(upload.path);
      archivoUrl = pub.publicUrl;
    }

    if (!archivoUrl) {
      return NextResponse.json(
        { error: "Falta campo requerido: archivoUrl (o archivo)" },
        { status: 400 }
      );
    }

    // Calcular versión automáticamente si no la pasaron: count + 1 de los
    // renders de esa solicitud.
    let version = body.version != null ? Number(body.version) : null;
    if (version == null || Number.isNaN(version)) {
      const { count, error: countErr } = await supabaseAdmin
        .from("renders")
        .select("*", { count: "exact", head: true })
        .eq("solicitudId", solicitudId);
      if (countErr) {
        if (countErr.code === "42P01") {
          return NextResponse.json({ needsSetup: true });
        }
        return NextResponse.json({ error: countErr.message }, { status: 500 });
      }
      version = (count ?? 0) + 1;
    }

    const { data, error } = await supabaseAdmin
      .from("renders")
      .insert({
        solicitudId,
        archivoUrl,
        version,
        aprobadoMercadeo: false,
        aprobadoCliente: false,
        notas,
        subidoPor,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "42P01") {
        return NextResponse.json({ needsSetup: true });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Auto-avanzar solicitud a EN_DISENIO si estaba en APROBADA o EN_MEDICION
    const { data: sol } = await supabaseAdmin
      .from("solicitudes_de_render")
      .select("estado")
      .eq("id", solicitudId)
      .single();
    if (sol && ["APROBADA", "EN_MEDICION"].includes(sol.estado)) {
      await supabaseAdmin
        .from("solicitudes_de_render")
        .update({ estado: "EN_DISENIO" })
        .eq("id", solicitudId);
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
