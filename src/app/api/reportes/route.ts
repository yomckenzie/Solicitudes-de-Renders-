import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const [pdvRes, mobRes, solRes] = await Promise.all([
      supabaseAdmin.from("puntos_de_venta").select("id, provincia, cadena, marca, estado"),
      supabaseAdmin.from("mobiliario").select("id, tipo, categoria, estado, medidas"),
      supabaseAdmin.from("solicitudes_de_render").select("id, tipo, estado, marca, createdAt"),
    ]);

    if (pdvRes.error || mobRes.error || solRes.error) {
      return NextResponse.json({ error: "Error al obtener datos" }, { status: 500 });
    }

    const pdvs = pdvRes.data ?? [];
    const muebles = mobRes.data ?? [];
    const solicitudes = solRes.data ?? [];

    // PDVs por estado
    const pdvPorEstado = pdvs.reduce((acc: Record<string, number>, p) => {
      acc[p.estado] = (acc[p.estado] || 0) + 1;
      return acc;
    }, {});

    // PDVs por provincia
    const pdvPorProvincia = pdvs.reduce((acc: Record<string, number>, p) => {
      acc[p.provincia] = (acc[p.provincia] || 0) + 1;
      return acc;
    }, {});

    // PDVs por marca
    const pdvPorMarca = pdvs.reduce((acc: Record<string, number>, p) => {
      acc[p.marca] = (acc[p.marca] || 0) + 1;
      return acc;
    }, {});

    // Muebles sin medidas
    const sinMedidas = muebles.filter(m => !m.medidas).length;

    // Muebles por tipo
    const mueblesPorTipo = muebles.reduce((acc: Record<string, number>, m) => {
      acc[m.tipo] = (acc[m.tipo] || 0) + 1;
      return acc;
    }, {});

    // Solicitudes por estado
    const solPorEstado = solicitudes.reduce((acc: Record<string, number>, s) => {
      acc[s.estado] = (acc[s.estado] || 0) + 1;
      return acc;
    }, {});

    // Solicitudes por tipo
    const solPorTipo = solicitudes.reduce((acc: Record<string, number>, s) => {
      acc[s.tipo] = (acc[s.tipo] || 0) + 1;
      return acc;
    }, {});

    // PDVs críticos (lista)
    const criticos = pdvs.filter(p => p.estado === "Critico").slice(0, 10);

    // Cadenas con más PDVs
    const porCadena = pdvs.reduce((acc: Record<string, number>, p) => {
      acc[p.cadena] = (acc[p.cadena] || 0) + 1;
      return acc;
    }, {});
    const topCadenas = Object.entries(porCadena)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    return NextResponse.json({
      pdv: {
        total: pdvs.length,
        porEstado: pdvPorEstado,
        porProvincia: pdvPorProvincia,
        porMarca: pdvPorMarca,
        topCadenas,
        criticos: criticos.length,
      },
      inventario: {
        total: muebles.length,
        sinMedidas,
        porTipo: mueblesPorTipo,
      },
      solicitudes: {
        total: solicitudes.length,
        porEstado: solPorEstado,
        porTipo: solPorTipo,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
