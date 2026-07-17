# DEPLOY — CornerMaster

## Opción A: Vercel (recomendado)

### 1. Subir el código a GitHub

```bash
cd "C:\Users\yomck\OneDrive\Documentos\Pagina Corners\web"
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/cornermaster.git
git push -u origin main
```

### 2. Conectar a Vercel

1. Ir a https://vercel.com → Sign up con GitHub
2. **New Project** → seleccionar el repo
3. **Root Directory**: configurá `web` (importante: Vercel debe compilar desde `web/`, no desde la raíz)
4. **Environment Variables**: agregar las 3 variables de Supabase
5. **Deploy**

### 3. Configurar el dominio (opcional)

Vercel te da un `*.vercel.app` gratis. Si querés dominio custom, comprá uno y configuralo en **Settings → Domains**.

### 4. Configurar Supabase para producción

En Supabase Dashboard → **Authentication → URL Configuration**:

- **Site URL**: `https://tu-app.vercel.app`
- **Redirect URLs**: agregar `https://tu-app.vercel.app/auth/callback` (aunque no usamos OAuth, no molesta)

---

## Opción B: Railway

1. Ir a https://railway.app → Sign up con GitHub
2. **New Project → Deploy from GitHub repo**
3. Configurar **Root Directory** = `web`
4. **Variables**: agregar las 3 de Supabase
5. Railway detecta Next.js automáticamente. **Start command**: `npm start` (después del build)
6. **Settings → Networking → Generate Domain**

---

## Opción C: Auto-deploy con GitHub Actions (alternativa)

Si querés control fino, en `.github/workflows/deploy.yml`:

```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '24' }
      - run: cd web && npm ci
      - run: cd web && npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: web
```

---

## Pre-deploy checklist

- [ ] Las 3 variables de Supabase están en el ambiente de deploy
- [ ] El `Site URL` en Supabase apunta al dominio de producción
- [ ] El primer usuario `superadmin` fue creado (ver README principal paso 3)
- [ ] El bucket `corner-fotos` existe en Supabase Storage (la migración SQL lo crea automáticamente)
- [ ] Las migraciones SQL están aplicadas (no se aplican solas; hay que correrlas en el SQL Editor)

---

## Costos estimados

| Servicio | Plan            | Costo        |
|----------|------------------|--------------|
| Vercel   | Free / Hobby     | $0–$20/mes   |
| Supabase | Free / Pro       | $0–$25/mes   |
| Dominio  | Opcional         | ~$12/año     |

**Total mínimo para arrancar**: $0/mes (planes free de ambos).
**Para producción en serio**: ~$30-50/mes.
