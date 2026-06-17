import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Wrapper que retorna la función "proxy" (nombre requerido por Next.js 16)
const authMiddleware = withAuth(
  function middleware() {
    return NextResponse.next();
  },
  {
    pages: {
      signIn: "/login",
    },
  }
);

export default authMiddleware;

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
