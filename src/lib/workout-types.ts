/**
 * Vektor — Tipos de dominio del tracker en vivo (compartidos cliente/UI).
 *
 * Representan un ejercicio cargado en el "Modo Gimnasio" con todo lo que el
 * tracker necesita para puntuar series, mostrar la píldora de progresión y el
 * historial inline, sin volver a tocar la base de datos durante el entreno.
 */

import type { LoadType, MuscleGroup, RankThresholds } from "./rank-config";
import type { SessionSummary } from "./ranking-engine";

export type SetType = "WARMUP" | "WORKING" | "DROPSET" | "FAILURE";

/** Una serie en progreso dentro del tracker. */
export interface ActiveSet {
  /** UUID de cliente, estable para persistencia incremental. */
  clientId: string;
  setType: SetType;
  weightKg: number;
  reps: number;
  rir: number | null;
  /** Segundos para ejercicios isométricos. */
  durationSec: number | null;
  /** Marcada como completada (dispara el temporizador de descanso). */
  completed: boolean;
  /** 1RM estimado (o métrica equivalente) calculado al completar. */
  estimated1Rm: number | null;
  isPr: boolean;
}

/** Un ejercicio cargado en la sesión activa. */
export interface ActiveExercise {
  clientId: string;
  exerciseId: string;
  name: string;
  primaryMuscle: MuscleGroup;
  loadType: LoadType;
  rankThresholds: RankThresholds;
  /** Rango de reps objetivo (de la rutina o por defecto). */
  repRangeMin: number;
  repRangeMax: number;
  /** Descanso sugerido en segundos. */
  restSeconds: number;
  /** Mejor métrica histórica (para detectar PR). */
  bestHistoricalScore: number;
  /** Resumen de las últimas sesiones (para la píldora de progresión). */
  recentSessions: SessionSummary[];
  /** Referencia de la última sesión, para el historial inline. */
  lastSessionLabel: string | null;
  sets: ActiveSet[];
}

/** ¿El ejercicio se mide por tiempo (isometría) en lugar de reps? */
export function isIsometric(loadType: LoadType): boolean {
  return loadType === "ISOMETRIC_HOLD";
}

/** ¿El peso es ajustable (carga externa o lastre) o fijo en 0 (peso corporal)? */
export function usesExternalWeight(loadType: LoadType): boolean {
  return loadType === "EXTERNAL" || loadType === "WEIGHTED_BODYWEIGHT";
}
