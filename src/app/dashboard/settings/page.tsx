import { PageHeader } from "@/components/PageHeader";

export const metadata = { title: "Configuración — CornerMaster" };

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Configuración"
        description="Ajustes del sistema y datos del proyecto."
      />
      <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200/60 space-y-4">
        <section>
          <h2 className="text-base font-semibold text-slate-900">Catálogos del sistema</h2>
          <p className="text-sm text-slate-600 mt-1">
            Las marcas (JC, JCX, CK, JCB), categorías (Casual, Interior) y los 5 estados
            operativos están definidos como catálogos cerrados en <code className="text-xs">src/lib/constants.ts</code>.
            Para modificarlos, editá ese archivo y desplegá.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-slate-900">Migración de Excel</h2>
          <p className="text-sm text-slate-600 mt-1">
            Para cargar data existente desde tu Excel, usá la plantilla{" "}
            <code className="text-xs">../corners_template.csv</code> como puente, y luego
            insertá en Supabase vía SQL Editor o panel de Table Editor.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-slate-900">Roles y permisos</h2>
          <ul className="mt-2 text-sm text-slate-700 space-y-1">
            <li><strong>superadmin</strong> — control total, gestión de usuarios</li>
            <li><strong>gerente</strong> — ver, crear, editar y eliminar</li>
            <li><strong>proyectos</strong> — ver, crear, editar (cotizaciones, renders)</li>
            <li><strong>supervisor</strong> — campo: carga de fotos y estados</li>
          </ul>
        </section>
      </div>
    </>
  );
}
