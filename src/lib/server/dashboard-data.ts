/**
 * Vektor — Carga de datos del dashboard desde Supabase (servidor).
 *
 * Lee perfil, snapshots de rango muscular, volumen semanal y peso corporal del
 * usuario. Si Supabase no está configurado o la base está vacía, devuelve un
 * estado inicial limpio (fallback) para que la app arranque igualmente.
 */

import { prisma } from "../db/prisma";
import { isSupabaseConfigured } from "../db/supabase";
import {
  computeGlobalRank,
  type MuscleRankState,
} from "../ranking-engine";
import { RANK_META } from "../rank-config";
import type { CompetitiveRank, MuscleGroup, SubTier } from "../rank-config";

export interface DashboardData {
  bodyWeightKg: number;
  global: {
    rank: CompetitiveRank;
    subTier: SubTier;
    progressPct: number;
    normalizedScore: number;
    asymmetryPenalty: boolean;
  };
  muscleStates: Partial<Record<MuscleGroup, MuscleRankState>>;
  weeklySets: Partial<Record<MuscleGroup, number>>;
  source: "supabase" | "empty";
}

/** Estado inicial limpio cuando no hay datos ni backend. */
export function emptyDashboard(bodyWeightKg = 75): DashboardData {
  return {
    bodyWeightKg,
    global: {
      rank: "IRON",
      subTier: "I",
      progressPct: 0,
      normalizedScore: 0,
      asymmetryPenalty: false,
    },
    muscleStates: {},
    weeklySets: {},
    source: "empty",
  };
}

export async function loadDashboardData(userId: string): Promise<DashboardData> {
  if (!isSupabaseConfigured()) return emptyDashboard();

  try {
    const profile = await prisma.userProfile.findUnique({ where: { id: userId } });
    if (!profile) return emptyDashboard();

    const snapshots = await prisma.muscleRankSnapshot.findMany({
      where: { userId },
    });

    const muscleStates: Partial<Record<MuscleGroup, MuscleRankState>> = {};
    const weeklySets: Partial<Record<MuscleGroup, number>> = {};
    const normalizedScores: number[] = [];

    for (const snap of snapshots) {
      const muscle = snap.muscleGroup as MuscleGroup;
      // El score normalizado se reconstruye desde rango + progreso.
      const base = RANK_META[snap.currentRank as CompetitiveRank].order * (100 / 9);
      const normalized = base + (snap.progressPct / 100) * (100 / 9);
      normalizedScores.push(normalized);

      muscleStates[muscle] = {
        rank: snap.currentRank as CompetitiveRank,
        subTier: snap.subTier as SubTier,
        progressPct: snap.progressPct,
        normalizedScore: Math.round(normalized * 10) / 10,
        weeklySets: snap.weeklySets,
        bestPrLabel: null,
        exercises: [],
        hasData: true,
      };
      if (snap.weeklySets > 0) weeklySets[muscle] = snap.weeklySets;
    }

    const globalResult = computeGlobalRank(normalizedScores);
    const mean =
      normalizedScores.length > 0
        ? normalizedScores.reduce((a, b) => a + b, 0) / normalizedScores.length
        : 0;
    const asymmetryPenalty = mean - globalResult.normalizedScore > 2;

    return {
      bodyWeightKg: profile.bodyWeightKg,
      global: {
        rank: profile.globalRank as CompetitiveRank,
        subTier: profile.globalSubTier as SubTier,
        progressPct: profile.globalRankProgress,
        normalizedScore: globalResult.normalizedScore,
        asymmetryPenalty,
      },
      muscleStates,
      weeklySets,
      source: "supabase",
    };
  } catch (err) {
    console.error("[dashboard-data] fallback a estado vacío:", err);
    return emptyDashboard();
  }
}
