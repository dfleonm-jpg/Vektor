/**
 * Vektor — Cliente Prisma singleton.
 *
 * En desarrollo, Next recarga módulos en caliente; reutilizar la instancia
 * evita agotar el pool de conexiones de Supabase.
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
