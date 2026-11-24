/**
 * Vektor — Recálculo de rangos y PRs tras sincronizar una sesión (servidor).
 *
 * Al llegar una sesión al sync worker:
 *   1. Marca PRs reales comparando el 1RM/marca de cada serie efectiva contra el
 *      mejor histórico del ejercicio (de WorkoutSet anteriores).
 *   2. Recalcula el MuscleRankSnapshot de cada músculo tocado (promedio
 *      ponderado de sus ejercicios) y las series semanales efectivas.
 *   3. Recalcula el rango global del atleta y su progreso.
 *
 * Todo pasa por el motor puro (`ranking-engine`), de modo que el servidor y el
 * cliente comparten exactamente la misma matemática.
 */

import type { PrismaClient } from "@prisma/client";
import {
  computeGlobalRank,
  computeMuscleRank,
  computeRank,
  scorePerformance,
  type MuscleRankState,
} from "../ranking-engine";
import type {
  CompetitiveRank,
  MuscleGroup,
  RankThresholds,
  SubTier,
} from "../rank-config";
import { MUSCLE_GROUPS } from "../rank-config";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Recalcula snapshots de rango muscular, rango global y PRs para un usuario a
 * partir de todo su historial de series. Idempotente: puede ejecutarse tras
 * cada sync sin efectos acumulativos erróneos.
 */
export async function recomputeUserRanks(
  prisma: PrismaClient,
  userId: string,
): Promise<void> {
  const profile = await prisma.userProfile.findUnique({ where: { id: userId } });
  if (!profile) return;
  const bodyWeightKg = profile.bodyWeightKg;

  // Todas las series efectivas del usuario con su ejercicio.
  const sets = await prisma.workoutSet.findMany({
    where: {
      session: { userId },
      setType: { in: ["WORKING", "FAILURE"] },
    },
    include: {
      exercise: {
        select: {
          id: true,
          primaryMuscle: true,
          rankThresholdsJson: true,
        },
      },
      session: { select: { startedAt: true } },
    },
  });

  // Mejor puntuación por ejercicio y acumulador por músculo.
  const bestByExercise = new Map<string, number>();
  const exerciseMuscle = new Map<string, MuscleGroup>();
  const exerciseThresholds = new Map<string, RankThresholds>();
  const weeklySetsByMuscle = new Map<MuscleGroup, number>();
  const now = Date.now();

  for (const s of sets) {
    const thresholds = s.exercise.rankThresholdsJson as unknown as RankThresholds;
    const score = scorePerformance({
      loadType: loadTypeOf(thresholds),
      bodyWeightKg,
      weightKg: s.weightKg,
      reps: s.reps,
      rir: s.rir,
      durationSec: s.durationSec,
    });

    const prevBest = bestByExercise.get(s.exerciseId) ?? 0;
    if (score.value > prevBest) bestByExercise.set(s.exerciseId, score.value);
    exerciseMuscle.set(s.exerciseId, s.exercise.primaryMuscle as MuscleGroup);
    exerciseThresholds.set(s.exerciseId, thresholds);

    // Series semanales efectivas por músculo primario.
    if (now - new Date(s.session.startedAt).getTime() <= SEVEN_DAYS_MS) {
      const m = s.exercise.primaryMuscle as MuscleGroup;
      weeklySetsByMuscle.set(m, (weeklySetsByMuscle.get(m) ?? 0) + 1);
    }
  }

  // Puntuación normalizada por ejercicio y agrupación por músculo.
  const scoresByMuscle = new Map<MuscleGroup, number[]>();
  for (const [exerciseId, bestValue] of bestByExercise) {
    const thresholds = exerciseThresholds.get(exerciseId)!;
    const muscle = exerciseMuscle.get(exerciseId)!;
    const { normalizedScore } = computeRank(bestValue, thresholds);
    const list = scoresByMuscle.get(muscle) ?? [];
    list.push(normalizedScore);
    scoresByMuscle.set(muscle, list);
  }

  // Snapshot por músculo.
  const muscleNormalized: number[] = [];
  for (const muscle of MUSCLE_GROUPS) {
    const scores = scoresByMuscle.get(muscle) ?? [];
    const result =
      scores.length > 0
        ? computeMuscleRank(scores.map((normalizedScore) => ({ normalizedScore, weight: 1 })))
        : null;
    const weeklySets = weeklySetsByMuscle.get(muscle) ?? 0;

    if (result) muscleNormalized.push(result.normalizedScore);

    await prisma.muscleRankSnapshot.upsert({
      where: { userId_muscleGroup: { userId, muscleGroup: muscle } },
      update: {
        currentRank: (result?.rank ?? "IRON") as CompetitiveRank,
        subTier: (result?.subTier ?? "I") as SubTier,
        progressPct: result?.progressPct ?? 0,
        weeklySets,
      },
      create: {
        userId,
        muscleGroup: muscle,
        currentRank: (result?.rank ?? "IRON") as CompetitiveRank,
        subTier: (result?.subTier ?? "I") as SubTier,
        progressPct: result?.progressPct ?? 0,
        weeklySets,
      },
    });
  }

  // Rango global.
  const global = computeGlobalRank(muscleNormalized);
  await prisma.userProfile.update({
    where: { id: userId },
    data: {
      globalRank: global.rank as CompetitiveRank,
      globalSubTier: global.subTier as SubTier,
      globalRankProgress: global.progressPct,
    },
  });

  // Marca PRs: la serie con mayor 1RM por ejercicio.
  await markPersonalRecords(prisma, userId, bestByExercise);
}

/**
 * El tipo de carga vive implícito en la métrica de los umbrales. Esta función
 * lo recupera para re-puntuar en servidor sin otra consulta.
 */
function loadTypeOf(thresholds: RankThresholds) {
  switch (thresholds.metric) {
    case "seconds":
      return "ISOMETRIC_HOLD" as const;
    case "reps":
      return "BODYWEIGHT_REPS" as const;
    default:
      // ratio cubre carga externa y lastrada; ambas puntúan igual (1RM/BW).
      return "EXTERNAL" as const;
  }
}

/** Marca como PR la serie con la mejor marca histórica de cada ejercicio. */
async function markPersonalRecords(
  prisma: PrismaClient,
  userId: string,
  bestByExercise: Map<string, number>,
): Promise<void> {
  for (const exerciseId of bestByExercise.keys()) {
    const setsForExercise = await prisma.workoutSet.findMany({
      where: { exerciseId, session: { userId }, setType: { in: ["WORKING", "FAILURE"] } },
      select: { id: true, estimated1Rm: true, reps: true, durationSec: true },
    });
    if (setsForExercise.length === 0) continue;

    // Métrica comparable: 1RM si existe, si no reps, si no segundos.
    let bestId: string | null = null;
    let bestMetric = -Infinity;
    for (const s of setsForExercise) {
      const metric = s.estimated1Rm ?? s.reps ?? s.durationSec ?? 0;
      if (metric > bestMetric) {
        bestMetric = metric;
        bestId = s.id;
      }
    }

    // Resetea isPr y marca solo el mejor (idempotente).
    await prisma.workoutSet.updateMany({
      where: { exerciseId, session: { userId } },
      data: { isPr: false },
    });
    if (bestId) {
      await prisma.workoutSet.update({ where: { id: bestId }, data: { isPr: true } });
    }
  }
}

/** Construye el MuscleRankState de la UI a partir de un snapshot persistido. */
export function snapshotToState(snapshot: {
  currentRank: string;
  subTier: string;
  progressPct: number;
  weeklySets: number;
  normalizedScore?: number;
}): MuscleRankState {
  return {
    rank: snapshot.currentRank as CompetitiveRank,
    subTier: snapshot.subTier as SubTier,
    progressPct: snapshot.progressPct,
    normalizedScore: snapshot.normalizedScore ?? 0,
    weeklySets: snapshot.weeklySets,
    bestPrLabel: null,
    exercises: [],
    hasData: true,
  };
}
