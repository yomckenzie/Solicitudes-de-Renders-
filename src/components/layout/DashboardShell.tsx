"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { SidebarContent } from "@/components/layout/Sidebar";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Cerrar drawer en navegación (back/forward)
  useEffect(() => {
    const handlePopState = () => setMobileOpen(false);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Bloquear scroll del body cuando el drawer móvil está abierto
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-30 bg-gray-900 text-white h-14 flex items-center px-4 shadow-md">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 -ml-2 hover:bg-gray-800 rounded-lg"
          aria-label="Abrir menú"
        >
          <Menu size={20} />
        </button>
        <div className="flex-1 text-center">
          <span className="text-sm font-bold">Solicitudes de Renders</span>
        </div>
        <div className="w-9" /> {/* spacer para centrar el título */}
      </header>

      {/* Mobile drawer (overlay + sidebar) */}
      {mobileOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/50"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="md:hidden fixed top-0 left-0 bottom-0 z-50 w-72 max-w-[85vw] bg-gray-900 text-white flex flex-col shadow-2xl">
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 bg-gray-900 text-white flex-col min-h-screen shrink-0 sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto pt-14 md:pt-0">{children}</main>
    </div>
  );
}
