/**
 * Ejecuta SQL en Supabase via Management API (sin necesidad de puerto 5432).
 * Uso: npx ts-node src/lib/migrate.ts "SELECT ..."
 * O importar runQuery() en scripts de Node.
 */
export async function runQuery(sql: string): Promise<unknown[]> {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${process.env.SUPABASE_PROJECT_REF}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sql }),
    }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
