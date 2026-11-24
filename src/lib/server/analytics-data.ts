/**
 * Vektor — Carga de datos de analítica desde Supabase (servidor).
 *
 * Reconstruye series de 1RM por ejercicio, tonelaje/series por sesión, histórico
 * de peso corporal con fuerza relativa, y el muro de PRs. Si no hay backend o
 * datos, devuelve series de demostración coherentes para que la vista renderice.
 */

import { prisma } from "../db/prisma";
import { isSupabaseConfigured } from "../db/supabase";
import { computeRank } from "../ranking-engine";
import type { RankThresholds } from "../rank-config";
import type {
  BodyWeightPoint,
  OneRmPoint,
  TonnagePoint,
} from "../../components/analytics/ProgressCharts";
import type { PrEntry } from "../../components/analytics/PrWall";

export interface AnalyticsData {
  oneRmByExercise: Record<string, OneRmPoint[]>;
  tonnage: TonnagePoint[];
  bodyWeight: BodyWeightPoint[];
  prs: PrEntry[];
  source: "supabase" | "demo";
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("es", { day: "2-digit", month: "2-digit" });
}

export async function loadAnalyticsData(userId: string): Promise<AnalyticsData> {
  if (!isSupabaseConfigured()) return demoAnalytics();

  try {
    const sessions = await prisma.workoutSession.findMany({
      where: { userId, finishedAt: { not: null } },
      orderBy: { startedAt: "asc" },
      include: { sets: { include: { exercise: true } } },
    });
    if (sessions.length === 0) return demoAnalytics();

    const oneRmByExercise: Record<string, OneRmPoint[]> = {};
    const tonnage: TonnagePoint[] = [];

    for (const session of sessions) {
      const date = fmtDate(session.startedAt);
      let effectiveSets = 0;
      const bestPerExercise = new Map<string, { name: string; value: number }>();

      for (const set of session.sets) {
        if (set.setType === "WORKING" || set.setType === "FAILURE") effectiveSets++;
        const metric = set.estimated1Rm ?? set.reps ?? set.durationSec ?? 0;
        const prev = bestPerExercise.get(set.exerciseId);
        if (!prev || metric > prev.value) {
          bestPerExercise.set(set.exerciseId, { name: set.exercise.name, value: metric });
        }
      }

      for (const { name, value } of bestPerExercise.values()) {
        (oneRmByExercise[name] ??= []).push({ date, value: Math.round(value * 10) / 10 });
      }
      tonnage.push({ date, tonnageKg: session.totalVolumeKg, sets: effectiveSets });
    }

    // Peso corporal + fuerza relativa (ratio del mejor 1RM global / peso).
    const metrics = await prisma.bodyMetricLog.findMany({
      where: { userId },
      orderBy: { recordedAt: "asc" },
    });
    const bodyWeight: BodyWeightPoint[] = metrics.map((m) => ({
      date: fmtDate(m.recordedAt),
      weightKg: m.weightKg,
      relativeStrength: 0, // se completa abajo si hay datos de fuerza
    }));

    // PRs: la mejor serie marcada por ejercicio.
    const prSets = await prisma.workoutSet.findMany({
      where: { session: { userId }, isPr: true },
      include: { exercise: true, session: true },
    });
    const prs: PrEntry[] = prSets.map((s) => {
      const thresholds = s.exercise.rankThresholdsJson as unknown as RankThresholds;
      const value = s.estimated1Rm ?? s.reps ?? s.durationSec ?? 0;
      const { rank } = computeRank(value, thresholds);
      const label =
        s.durationSec != null
          ? `${s.exercise.name} ${s.durationSec}s`
          : `${s.weightKg > 0 ? `${s.weightKg} kg` : "PC"} × ${s.reps}`;
      return {
        exerciseName: s.exercise.name,
        muscle: s.exercise.primaryMuscle,
        bestLabel: label,
        date: fmtDate(s.session.startedAt),
        rank,
      };
    });

    return { oneRmByExercise, tonnage, bodyWeight, prs, source: "supabase" };
  } catch (err) {
    console.error("[analytics-data] fallback a demo:", err);
    return demoAnalytics();
  }
}

/** Series de demostración coherentes con el tema (sin backend). */
export function demoAnalytics(): AnalyticsData {
  const days = ["01/11", "08/11", "15/11", "22/11"];
  return {
    oneRmByExercise: {
      "Press de banca con barra": days.map((date, i) => ({ date, value: 85 + i * 2.5 })),
      "Sentadilla con barra": days.map((date, i) => ({ date, value: 130 + i * 5 })),
      "Dominadas": days.map((date, i) => ({ date, value: 10 + i })),
    },
    tonnage: days.map((date, i) => ({
      date,
      tonnageKg: 8200 + i * 450,
      sets: 18 + i,
    })),
    bodyWeight: days.map((date, i) => ({
      date,
      weightKg: 80.5 - i * 0.3,
      relativeStrength: 1.05 + i * 0.03,
    })),
    prs: [
      { exerciseName: "Press de banca con barra", muscle: "CHEST", bestLabel: "92.5 kg × 3", date: "22/11", rank: "DIAMOND" },
      { exerciseName: "Sentadilla con barra", muscle: "QUADS", bestLabel: "150 kg × 2", date: "22/11", rank: "EMERALD" },
      { exerciseName: "Dominadas", muscle: "LATS", bestLabel: "PC × 13", date: "15/11", rank: "EMERALD" },
      { exerciseName: "L-sit", muscle: "CORE", bestLabel: "L-sit 32s", date: "08/11", rank: "GOLD" },
    ],
    source: "demo",
  };
}
