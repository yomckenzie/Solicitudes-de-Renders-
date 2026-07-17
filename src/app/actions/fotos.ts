"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const BUCKET = "corner-fotos";

export async function uploadFoto(cornerRowId: string, formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) throw new Error("No se envió ningún archivo");
  if (file.size > 10 * 1024 * 1024) throw new Error("La foto no puede pesar más de 10MB");
  if (!file.type.startsWith("image/")) throw new Error("El archivo debe ser una imagen");

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${cornerRowId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) throw new Error(uploadError.message);

  const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(path);

  const { error: dbError } = await supabase.from("corner_fotos").insert({
    corner_id: cornerRowId,
    url: publicUrl.publicUrl,
    thumbnail_url: publicUrl.publicUrl,
    subido_por: user.id,
    fecha: new Date().toISOString().slice(0, 10),
  });

  if (dbError) {
    await supabase.storage.from(BUCKET).remove([path]);
    throw new Error(dbError.message);
  }

  revalidatePath("/dashboard/corners", "page");
}

export async function deleteFoto(fotoId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: foto } = await supabase
    .from("corner_fotos")
    .select("url, subido_por")
    .eq("id", fotoId)
    .single();

  if (!foto) throw new Error("Foto no encontrada");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const canDelete = profile?.role === "superadmin" || profile?.role === "gerente" || foto.subido_por === user.id;
  if (!canDelete) throw new Error("No autorizado");

  try {
    const url = new URL(foto.url);
    const path = url.pathname.split(`/${BUCKET}/`)[1];
    if (path) await supabase.storage.from(BUCKET).remove([path]);
  } catch { /* ignore */ }

  const { error } = await supabase.from("corner_fotos").delete().eq("id", fotoId);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/corners", "page");
}
