import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase";
import type { Rol } from "@/types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      rol: Rol;
    };
  }
  interface User {
    id: string;
    email: string;
    name: string;
    rol: Rol;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    rol: Rol;
  }
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("[nextauth] login attempt with missing credentials");
          return null;
        }

        const email = credentials.email.toLowerCase().trim();

        try {
          const { data, error } = await supabaseAdmin
            .from("usuarios")
            .select("id, nombre, email, password, rol, activo")
            .eq("email", email)
            .eq("activo", true)
            .maybeSingle();

          if (error) {
            console.error("[nextauth] supabase error:", error.message);
            return null;
          }
          if (!data) {
            console.log("[nextauth] user not found or inactive:", email);
            return null;
          }

          const ok = await bcrypt.compare(credentials.password, data.password);
          if (!ok) {
            console.log("[nextauth] password mismatch for:", email);
            return null;
          }

          console.log("[nextauth] login OK:", email);
          return {
            id: data.id,
            email: data.email,
            name: data.nombre,
            rol: data.rol as Rol,
          };
        } catch (e) {
          console.error("[nextauth] authorize threw:", e);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.rol = user.rol;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.rol = token.rol;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
