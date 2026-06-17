import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware() {
    return;
  },
  {
    pages: {
      signIn: "/login",
    },
  }
);

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
