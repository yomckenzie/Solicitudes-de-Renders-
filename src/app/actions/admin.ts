"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ROLES, type Role } from "@/lib/constants";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "superadmin" && profile?.role !== "gerente") {
    throw new Error("No autorizado");
  }
  return { supabase, user };
}

export async function createMall(formData: FormData): Promise<void> {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "").trim().toUpperCase();
  const nombre = String(formData.get("nombre") ?? "").trim();
  const ciudad = String(formData.get("ciudad") ?? "").trim();
  if (!id || !nombre || !ciudad) throw new Error("Todos los campos son obligatorios");
  const { error } = await supabase.from("malls").insert({ id, nombre, ciudad });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/malls");
}

export async function createTienda(formData: FormData): Promise<void> {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "").trim().toUpperCase();
  const mall_id = String(formData.get("mall_id") ?? "").trim();
  const nombre = String(formData.get("nombre") ?? "").trim();
  if (!id || !mall_id || !nombre) throw new Error("Todos los campos son obligatorios");
  const { error } = await supabase.from("tiendas").insert({ id, mall_id, nombre });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/malls");
}

export async function updateUserRole(userId: string, role: string): Promise<void> {
  const { supabase } = await requireAdmin();
  if (!ROLES.includes(role as Role)) throw new Error("Rol inválido");
  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/users");
}
