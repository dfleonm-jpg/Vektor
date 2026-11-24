/**
 * Vektor — Seed de la base de datos.
 *
 * Precarga el catálogo de ejercicios esenciales (80 entradas) con sus músculos
 * primario y secundarios, equipamiento, tipo de carga y los umbrales de fuerza
 * relativa para los 9 rangos.
 *
 * Idempotente: usa `upsert` por slug, así que puede ejecutarse varias veces sin
 * duplicar. Ejecutar con:  npm run db:seed
 */

import { PrismaClient, type Prisma } from "@prisma/client";
import { EXERCISE_CATALOG } from "./exercise-catalog";

const prisma = new PrismaClient();

async function main() {
  console.log(`🌱 Vektor seed: cargando ${EXERCISE_CATALOG.length} ejercicios…`);

  let created = 0;
  let updated = 0;

  for (const ex of EXERCISE_CATALOG) {
    const existing = await prisma.exercise.findUnique({
      where: { slug: ex.slug },
      select: { id: true },
    });

    await prisma.exercise.upsert({
      where: { slug: ex.slug },
      update: {
        name: ex.name,
        primaryMuscle: ex.primaryMuscle,
        secondaryMuscles: ex.secondaryMuscles,
        equipment: ex.equipment,
        loadType: ex.loadType,
        rankThresholdsJson: ex.rankThresholdsJson as unknown as Prisma.InputJsonValue,
        instructions: ex.instructions,
      },
      create: {
        name: ex.name,
        slug: ex.slug,
        primaryMuscle: ex.primaryMuscle,
        secondaryMuscles: ex.secondaryMuscles,
        equipment: ex.equipment,
        loadType: ex.loadType,
        rankThresholdsJson: ex.rankThresholdsJson as unknown as Prisma.InputJsonValue,
        instructions: ex.instructions,
        isCustom: false,
      },
    });

    if (existing) updated++;
    else created++;
  }

  console.log(`✅ Seed completado — ${created} creados, ${updated} actualizados.`);
}

main()
  .catch((e) => {
    console.error("❌ Error en el seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
