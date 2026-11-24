/**
 * Vektor — Sync worker.
 *
 * Procesa las operaciones que el cliente offline encola en IndexedDB:
 *   - UPSERT_SESSION  → sesión + sus series (idempotente por clientId).
 *   - LOG_BODY_WEIGHT → registro de peso corporal (idempotente por clientId).
 *   - SAVE_ROUTINE    → rutina + días + ejercicios.
 *
 * Tras persistir una sesión o un peso, recalcula MuscleRankSnapshot, rango
 * global y PRs. Idempotente: reenviar la misma operación no duplica datos.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { recomputeUserRanks } from "@/lib/server/rank-updater";
import {
  isSupabaseConfigured,
} from "@/lib/db/supabase";
import {
  syncOperationSchema,
  type BodyWeightLogInput,
  type RoutineInput,
  type WorkoutSessionInput,
} from "@/lib/schemas";

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Supabase no configurado en el servidor." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  const parsed = syncOperationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Operación inválida", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  try {
    const op = parsed.data;
    switch (op.type) {
      case "UPSERT_SESSION": {
        await upsertSession(op.payload);
        await recomputeUserRanks(prisma, op.payload.userId);
        return NextResponse.json({ ok: true, clientId: op.payload.clientId });
      }
      case "LOG_BODY_WEIGHT": {
        await logBodyWeight(op.payload);
        await recomputeUserRanks(prisma, op.payload.userId);
        return NextResponse.json({ ok: true, clientId: op.payload.clientId });
      }
      case "SAVE_ROUTINE": {
        const id = await saveRoutine(op.payload);
        return NextResponse.json({ ok: true, routineId: id });
      }
    }
  } catch (err) {
    console.error("[/api/sync] error:", err);
    return NextResponse.json(
      { ok: false, error: "Error procesando la operación" },
      { status: 500 },
    );
  }
}

/** Upsert idempotente de una sesión y sus series (por clientId). */
async function upsertSession(payload: WorkoutSessionInput): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const existing = await tx.workoutSession.findUnique({
      where: { clientId: payload.clientId },
      select: { id: true },
    });

    const data = {
      userId: payload.userId,
      routineDayId: payload.routineDayId,
      name: payload.name,
      startedAt: new Date(payload.startedAt),
      finishedAt: payload.finishedAt ? new Date(payload.finishedAt) : null,
      durationSec: payload.durationSec,
      totalVolumeKg: payload.totalVolumeKg,
      fatigueRpe: payload.fatigueRpe,
      notes: payload.notes,
    };

    let sessionId: string;
    if (existing) {
      await tx.workoutSession.update({ where: { id: existing.id }, data });
      // Reemplaza las series para reflejar el estado más reciente (idempotente).
      await tx.workoutSet.deleteMany({ where: { sessionId: existing.id } });
      sessionId = existing.id;
    } else {
      const created = await tx.workoutSession.create({
        data: { ...data, clientId: payload.clientId },
      });
      sessionId = created.id;
    }

    if (payload.sets.length > 0) {
      await tx.workoutSet.createMany({
        data: payload.sets.map((s) => ({
          sessionId,
          exerciseId: s.exerciseId,
          setOrder: s.setOrder,
          setType: s.setType,
          weightKg: s.weightKg,
          reps: s.reps,
          rir: s.rir,
          durationSec: s.durationSec,
          estimated1Rm: s.estimated1Rm,
          isPr: s.isPr,
          rankAchieved: s.rankAchieved,
        })),
      });
    }
  });
}

/** Registro de peso corporal idempotente (por clientId en notas/ventana). */
async function logBodyWeight(payload: BodyWeightLogInput): Promise<void> {
  // Idempotencia: evita duplicar el mismo registro si se reenvía.
  const recordedAt = new Date(payload.recordedAt);
  const existing = await prisma.bodyMetricLog.findFirst({
    where: {
      userId: payload.userId,
      weightKg: payload.weightKg,
      recordedAt,
    },
    select: { id: true },
  });
  if (existing) return;

  await prisma.$transaction([
    prisma.bodyMetricLog.create({
      data: {
        userId: payload.userId,
        weightKg: payload.weightKg,
        bodyFatPct: payload.bodyFatPct ?? null,
        recordedAt,
      },
    }),
    prisma.userProfile.update({
      where: { id: payload.userId },
      data: { bodyWeightKg: payload.weightKg },
    }),
  ]);
}

/** Crea una rutina con sus días y ejercicios (mapeando slugs a ids). */
async function saveRoutine(payload: RoutineInput): Promise<string> {
  if (!payload.userId) throw new Error("userId requerido para guardar rutina");

  // Resuelve todos los slugs a ids del catálogo.
  const slugs = payload.days.flatMap((d) => d.exercises.map((e) => e.exerciseSlug));
  const exercises = await prisma.exercise.findMany({
    where: { slug: { in: slugs } },
    select: { id: true, slug: true },
  });
  const idBySlug = new Map(exercises.map((e) => [e.slug, e.id]));

  const missing = slugs.filter((s) => !idBySlug.has(s));
  if (missing.length > 0) {
    throw new Error(`Slugs inexistentes en el catálogo: ${missing.join(", ")}`);
  }

  const routine = await prisma.routine.create({
    data: {
      userId: payload.userId,
      name: payload.name,
      description: payload.description ?? null,
      days: {
        create: payload.days.map((day) => ({
          name: day.name,
          dayOrder: day.dayOrder,
          exercises: {
            create: day.exercises.map((ex) => ({
              exerciseId: idBySlug.get(ex.exerciseSlug)!,
              exerciseOrder: ex.exerciseOrder,
              targetSets: ex.targetSets,
              repRangeMin: ex.repRangeMin,
              repRangeMax: ex.repRangeMax,
              restSeconds: ex.restSeconds,
              targetRir: ex.targetRir,
            })),
          },
        })),
      },
    },
  });

  return routine.id;
}
