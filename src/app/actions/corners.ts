"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIAS, ESTADOS, MARCAS, type Categoria, type Estado, type Marca } from "@/lib/constants";

function generarCornerId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `CRN-${s}`;
}

export async function createCorner(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const marca = String(formData.get("marca")) as Marca;
  const categoria = String(formData.get("categoria")) as Categoria;
  const mall_id = String(formData.get("mall_id"));
  const tienda_id = String(formData.get("tienda_id"));
  const estado = String(formData.get("estado") ?? "pendiente") as Estado;
  const responsable = String(formData.get("responsable") ?? "").trim() || null;
  const notas = String(formData.get("notas") ?? "").trim() || null;

  if (!MARCAS.includes(marca) || !CATEGORIAS.includes(categoria) || !ESTADOS.includes(estado) || !mall_id || !tienda_id) {
    throw new Error("Datos inválidos");
  }

  for (let i = 0; i < 3; i++) {
    const corner_id = generarCornerId();
    const { error } = await supabase.from("corners").insert({
      corner_id, marca, categoria, mall_id, tienda_id, estado,
      responsable, notas, created_by: user.id,
      fecha_ultima_actualizacion: new Date().toISOString().slice(0, 10),
    });
    if (!error) {
      revalidatePath("/dashboard");
      revalidatePath("/dashboard/corners");
      redirect(`/dashboard/corners/${corner_id}`);
    }
    if (!error.message.includes("corner_id")) throw error;
  }
  throw new Error("No se pudo generar un ID único");
}

export async function updateCorner(cornerId: string, formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const marca = String(formData.get("marca")) as Marca;
  const categoria = String(formData.get("categoria")) as Categoria;
  const mall_id = String(formData.get("mall_id"));
  const tienda_id = String(formData.get("tienda_id"));
  const estado = String(formData.get("estado")) as Estado;
  const responsable = String(formData.get("responsable") ?? "").trim() || null;
  const notas = String(formData.get("notas") ?? "").trim() || null;

  const { error } = await supabase
    .from("corners")
    .update({ marca, categoria, mall_id, tienda_id, estado, responsable, notas })
    .eq("corner_id", cornerId);

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/corners/${cornerId}`);
  revalidatePath("/dashboard/corners");
  revalidatePath("/dashboard");
}

export async function changeStatus(cornerId: string, estado: Estado): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!ESTADOS.includes(estado)) throw new Error("Estado inválido");

  const { error } = await supabase
    .from("corners")
    .update({ estado, fecha_ultima_actualizacion: new Date().toISOString().slice(0, 10) })
    .eq("corner_id", cornerId);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/corners");
  revalidatePath(`/dashboard/corners/${cornerId}`);
}

export async function deleteCorner(cornerId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "superadmin" && profile?.role !== "gerente") {
    throw new Error("No tenés permisos para eliminar corners");
  }

  const { error } = await supabase.from("corners").delete().eq("corner_id", cornerId);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/corners");
  revalidatePath("/dashboard");
  redirect("/dashboard/corners");
}
