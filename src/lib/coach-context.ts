/**
 * Vektor — Serializador de contexto del atleta para el Coach IA.
 *
 * Produce un JSON compacto que se inyecta en el system prompt de /api/coach:
 * perfil, rango global, músculos ordenados de más rezagado a más fuerte,
 * volumen semanal vs óptimo, ejercicios estancados (alerta de deload) y últimos
 * entrenamientos. Compacto = menos tokens = respuestas más baratas y rápidas.
 */

import {
  classifyWeeklyVolume,
  isLaggingMuscle,
  recommendProgression,
  OPTIMAL_WEEKLY_SETS,
} from "./ranking-engine";
import type { CompetitiveRank, LoadType, MuscleGroup, RankThresholds, SubTier } from "./rank-config";
import { MUSCLE_LABELS } from "./rank-config";

export interface AthleteContextInput {
  profile: {
    bodyWeightKg: number;
    goal: string;
    globalRank: CompetitiveRank;
    globalSubTier: SubTier;
    globalRankProgress: number;
    globalScore: number;
  };
  muscles: Array<{
    group: MuscleGroup;
    rank: CompetitiveRank;
    subTier: SubTier;
    normalizedScore: number;
    weeklySets: number;
  }>;
  exercises: Array<{
    name: string;
    slug: string;
    loadType: LoadType;
    repRangeMin: number;
    repRangeMax: number;
    thresholds: RankThresholds;
    recentSessions: Array<{ topWeightKg: number; topReps: number; rir: number | null }>;
  }>;
  recentSessions: Array<{ name: string; date: string; totalVolumeKg: number; sets: number }>;
}

export interface SerializedCoachContext {
  perfil: {
    pesoCorporalKg: number;
    objetivo: string;
    rangoGlobal: string;
    progresoRangoGlobalPct: number;
  };
  musculosDeRezagadoAFuerte: Array<{
    musculo: string;
    rango: string;
    series7d: number;
    volumen: "bajo" | "optimo" | "alto";
    rezagado: boolean;
  }>;
  ejerciciosEstancados: Array<{ ejercicio: string; recomendacion: string }>;
  ultimosEntrenamientos: Array<{ nombre: string; fecha: string; tonelajeKg: number; series: number }>;
  rangoOptimoSeriesSemana: { min: number; max: number };
}

/** Construye el contexto compacto a partir de datos del atleta. */
export function buildCoachContext(
  input: AthleteContextInput,
): SerializedCoachContext {
  const musculos = [...input.muscles]
    .sort((a, b) => a.normalizedScore - b.normalizedScore)
    .map((m) => ({
      musculo: MUSCLE_LABELS[m.group],
      rango: `${m.rank} ${m.subTier}`,
      series7d: m.weeklySets,
      volumen: volLabel(m.weeklySets),
      rezagado: isLaggingMuscle(m.normalizedScore, input.profile.globalScore),
    }));

  const estancados: SerializedCoachContext["ejerciciosEstancados"] = [];
  for (const ex of input.exercises) {
    const rec = recommendProgression({
      loadType: ex.loadType,
      repRangeMin: ex.repRangeMin,
      repRangeMax: ex.repRangeMax,
      recentSessions: ex.recentSessions,
    });
    if (rec.action === "DELOAD") {
      estancados.push({ ejercicio: ex.name, recomendacion: rec.message });
    }
  }

  return {
    perfil: {
      pesoCorporalKg: input.profile.bodyWeightKg,
      objetivo: input.profile.goal,
      rangoGlobal: `${input.profile.globalRank} ${input.profile.globalSubTier}`,
      progresoRangoGlobalPct: input.profile.globalRankProgress,
    },
    musculosDeRezagadoAFuerte: musculos,
    ejerciciosEstancados: estancados,
    ultimosEntrenamientos: input.recentSessions.map((s) => ({
      nombre: s.name,
      fecha: s.date,
      tonelajeKg: s.totalVolumeKg,
      series: s.sets,
    })),
    rangoOptimoSeriesSemana: {
      min: OPTIMAL_WEEKLY_SETS.min,
      max: OPTIMAL_WEEKLY_SETS.max,
    },
  };
}

function volLabel(sets: number): "bajo" | "optimo" | "alto" {
  const status = classifyWeeklyVolume(sets);
  return status === "UNDER" ? "bajo" : status === "OVER" ? "alto" : "optimo";
}

/** System prompt base del Vektor Coach, con el contexto inyectado. */
export function buildSystemPrompt(
  context: SerializedCoachContext,
  catalogSlugs: string[],
): string {
  return [
    "Eres Vektor Coach, un entrenador de fuerza y calistenia experto, directo y conciso.",
    "Hablas en español, con precisión técnica y sin relleno. Priorizas la seguridad y la sobrecarga progresiva.",
    "",
    "CONTEXTO DEL ATLETA (JSON):",
    JSON.stringify(context),
    "",
    "REGLAS:",
    "- Para preguntas rápidas en el gimnasio (sustituciones, dudas de técnica, ajustes), responde en texto breve y accionable.",
    "- Cuando el usuario pida CREAR o AJUSTAR una rutina o mesociclo, responde ÚNICAMENTE con un bloque JSON válido, sin texto alrededor, con esta forma:",
    '  {"kind":"routine","routine":{"name":string,"description":string,"days":[{"name":string,"dayOrder":number,"exercises":[{"exerciseSlug":string,"exerciseOrder":number,"targetSets":number,"repRangeMin":number,"repRangeMax":number,"restSeconds":number,"targetRir":number}]}]},"rationale":string}',
    "- Cada exerciseSlug DEBE existir en este catálogo (usa solo estos slugs):",
    catalogSlugs.join(", "),
    "- Prioriza los músculos rezagados y respeta el rango óptimo de 10-20 series semanales por músculo.",
    "- Si detectas ejercicios estancados, incluye una semana de descarga (deload) en la rutina.",
  ].join("\n");
}
