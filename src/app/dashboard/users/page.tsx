import { PageHeader } from "@/components/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { ROLES } from "@/lib/constants";
import { updateUserRole } from "@/app/actions/admin";

export const metadata = { title: "Usuarios — CornerMaster" };

export default async function UsersPage() {
  const supabase = await createClient();

  // Para listar usuarios necesitamos el service role; desde RLS sólo vemos el nuestro.
  // Solución: listar profiles visibles + invitación manual de nuevos.
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, created_at")
    .order("created_at", { ascending: false });

  return (
    <>
      <PageHeader
        title="Usuarios"
        description="Gestioná los miembros del equipo y sus roles. Solo superadmin puede editar."
      />

      <div className="rounded-2xl bg-white ring-1 ring-slate-200/60 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Creado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(profiles ?? []).map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-medium text-slate-900">{p.email}</td>
                <td className="px-4 py-3 text-slate-700">{p.full_name ?? "—"}</td>
                <td className="px-4 py-3">
                  <form action={async (fd: FormData) => {
                    "use server";
                    await updateUserRole(p.id, String(fd.get("role")));
                  }}>
                    <select
                      name="role"
                      defaultValue={p.role}
                      className="rounded-md border border-slate-300 px-2 py-1 text-xs focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
                    >
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <button type="submit" className="ml-2 text-xs text-emerald-700 hover:text-emerald-800">Guardar</button>
                  </form>
                </td>
                <td className="px-4 py-3 text-slate-600">{new Date(p.created_at).toLocaleDateString("es-CO")}</td>
              </tr>
            ))}
            {(!profiles || profiles.length === 0) && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">Sin usuarios todavía</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 rounded-2xl bg-amber-50 ring-1 ring-amber-200 p-4 text-sm text-amber-900">
        <p className="font-semibold">¿Sumar un nuevo usuario?</p>
        <p className="mt-1">Andá a <strong>Supabase Dashboard → Authentication → Users → Add user</strong>, creá el usuario con email/password, y después asignale el rol acá.</p>
      </div>
    </>
  );
}
