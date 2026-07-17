import { PageHeader } from "@/components/PageHeader";
import { CornerForm } from "@/components/CornerForm";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Nuevo corner — CornerMaster" };

export default async function NewCornerPage() {
  const supabase = await createClient();

  const [{ data: malls }, { data: tiendas }] = await Promise.all([
    supabase.from("malls").select("id, nombre, ciudad").order("nombre"),
    supabase.from("tiendas").select("id, nombre, mall_id").order("nombre"),
  ]);

  return (
    <>
      <PageHeader
        title="Nuevo corner"
        description="Cargá un corner nuevo. Te recomendamos tener fotos antes de marcar como 'actualizado'."
      />
      <CornerForm
        malls={malls ?? []}
        tiendas={tiendas ?? []}
        mode="create"
      />
    </>
  );
}
