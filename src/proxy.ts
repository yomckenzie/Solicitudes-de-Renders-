import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Nombre requerido por Next.js 16 (antes era "middleware")
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Buscar el cookie de sesión (en HTTPS se llama __Secure-next-auth.session-token)
  const sessionToken =
    request.cookies.get("__Secure-next-auth.session-token")?.value ||
    request.cookies.get("next-auth.session-token")?.value;

  if (!sessionToken) {
    // Sin sesión → redirigir a /login preservando la URL original
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/login") {
      loginUrl.searchParams.set("callbackUrl", pathname + search);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/pdv/:path*",
    "/api/inventario/:path*",
    "/api/solicitudes/:path*",
    "/api/visitas/:path*",
    "/api/tareas/:path*",
    "/api/cotizaciones/:path*",
    "/api/pagos/:path*",
    "/api/instalaciones/:path*",
    "/api/renders/:path*",
    "/api/reportes/:path*",
    "/api/usuarios/:path*",
  ],
};
