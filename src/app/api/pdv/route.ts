import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const provincia = searchParams.get("provincia");
  const cadena = searchParams.get("cadena");
  const estado = searchParams.get("estado");
  const marca = searchParams.get("marca");
  const q = searchParams.get("q");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const pageSize = 50;

  try {
    let query = supabaseAdmin
      .from("puntos_de_venta")
      .select("*", { count: "exact" });

    if (provincia) query = query.eq("provincia", provincia);
    if (cadena) query = query.eq("cadena", cadena);
    if (estado) query = query.eq("estado", estado);
    if (marca) query = query.eq("marca", marca);
    if (q) {
      query = query.or(
        `cadena.ilike.%${q}%,mallZona.ilike.%${q}%,impulsador.ilike.%${q}%`
      );
    }

    const { data, count, error } = await query
      .order("numeroPdv", { ascending: true })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ data, total: count ?? 0, page, pageSize });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
