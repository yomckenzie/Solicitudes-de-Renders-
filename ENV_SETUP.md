# Variables de entorno — CornerMaster

Copiá el bloque de abajo en un archivo nuevo llamado `.env.local` dentro de esta carpeta (`web/`) y completá los valores reales. **No commitear jamás `.env.local` a git.**

## 1. Crear proyecto en Supabase

1. Ir a https://supabase.com/dashboard y crear cuenta / nuevo proyecto
2. Guardar la **password de la base de datos** (te la pide al crear)
3. Ir a **Project Settings → API** y copiar:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** (botón "Reveal") → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ server-side only

## 2. Plantilla

```env
# --- Supabase ---
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...tu-service-role-key

# --- App ---
NEXT_PUBLIC_APP_NAME="CornerMaster"
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 3. Verificar

Después de copiar, levantá el server con `npm run dev` y andá a http://localhost:3000. Si no hay error de "Invalid Supabase URL", está OK.

## 4. Crear el primer usuario admin

Una vez que el server esté corriendo:

1. Andá a Supabase Dashboard → **Authentication → Users → Add user → Create new user**
2. Email: el que quieras usar (ej. `gerente@tuempresa.com`)
3. Password: una segura
4. Después en **SQL Editor** corré:
   ```sql
   update public.profiles
   set role = 'superadmin'
   where id = 'EL-UUID-DEL-USUARIO';
   ```
