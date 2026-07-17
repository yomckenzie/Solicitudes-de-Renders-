# Playwright — Cómo correr los tests

## Setup (una sola vez)

```powershell
cd "C:\Users\yomck\OneDrive\Documentos\Pagina Corners\web"

# 1. Instalar Playwright y el browser (ya hecho, pero por si reinstalás)
npm install
npx playwright install chromium

# 2. Crear usuario de prueba en Supabase
#    Andá a Supabase → Authentication → Add user
#    Email: test-e2e@tuempresa.com
#    Password: una password cualquiera

# 3. Configurar las credenciales del test
copy .env.test.example .env.test
notepad .env.test
# Editá TEST_USER_EMAIL y TEST_USER_PASSWORD con los valores del paso 2
```

## Correr los tests

```powershell
# Todos los tests (headless)
npm test

# Solo un archivo
npm test -- corners-list

# Solo un test por nombre
npm test -- --grep "filtro por marca"

# Con interfaz visual (debugging)
npm run test:ui

# Viendo el browser mientras corre
npm run test:headed

# Paso a paso con debugger
npm run test:debug

# Ver el reporte HTML de la última corrida
npm run test:report
```

## Roles y qué tests corren

| Rol del test user | Tests que corren | Tests que se saltan |
|---|---|---|
| `supervisor` | auth, dashboard, corners-list, corners-detail, corners-create | admin (todo) |
| `gerente` | todos + admin de malls/tiendas | cambiar roles de otros users |
| `superadmin` | todos, sin restricciones | — |

Los tests **leen automáticamente el rol del sidebar** y se saltean si no corresponde. Vas a ver en consola:

```
✓ 18 tests pasaron
⊘  4 tests salteados (admin: requiere superadmin)
```

## Estructura

```
e2e/
├── auth.setup.ts              ← login una vez, guarda sesión en playwright/.auth/
├── auth.spec.ts               ← redirect, login, logout, errores
├── dashboard.spec.ts          ← KPIs, donut, sin errores de consola
├── corners-list.spec.ts       ← tabla, filtros, búsqueda
├── corners-detail.spec.ts     ← detalle, quick status, audit
├── corners-create.spec.ts     ← crear nuevo (E2E real)
└── admin.spec.ts              ← malls, usuarios, settings (gated por rol)
```

## Buenas prácticas

- **No uses tu usuario personal** como TEST_USER. Los tests crean y borran datos. Creá uno dedicado.
- **El primer test tarda más** porque Next.js dev mode tiene que compilar cada página. Los siguientes son rápidos.
- **Si un test falla por timeout**, fijate si Next.js sigue corriendo (`npm run dev` separado). El config auto-arranca el server, pero si lo tenés vos también, podés tener conflictos de puerto.

## Troubleshooting

### "Faltan variables TEST_USER_EMAIL..."
No existe `.env.test` o está vacío. Copiá `.env.test.example` y completá.

### "Timeout exceeded" en login
Supabase está bloqueando el user. Andá a Supabase → Authentication → Users y verificá que `Auto Confirm User` esté activo.

### "Port 3000 already in use"
Cerrá cualquier otro `npm run dev` que tengas corriendo.

### Tests flaky (pasan a veces sí, a veces no)
- Probable: Supabase free tier rate limiting. Solución: cambiar `workers: 1` a `workers: 2` o agregar `await page.waitForLoadState('networkidle')` en los tests.