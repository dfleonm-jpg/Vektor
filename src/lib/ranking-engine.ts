/**
 * Vektor — Motor matemático de rendimiento y rangos.
 *
 * Reúne toda la lógica determinística de la app:
 *   1. Estimación de 1RM (Epley, con ajuste por RIR).
 *   2. Fuerza relativa según el tipo de carga.
 *   3. Cálculo del rango a 3 niveles (ejercicio, grupo muscular, global)
 *      con sub-niveles I/II/III y porcentaje exacto hacia el siguiente escalón.
 *   4. Algoritmo de sobrecarga progresiva (doble progresión).
 *
 * El módulo es puro (sin I/O ni dependencias de framework) para que pueda
 * usarse tanto en el cliente (tracker en vivo) como en el servidor (cierre
 * de sesión, endpoint de IA) y sea trivialmente testeable.
 */

import {
  COMPETITIVE_RANKS,
  RANK_META,
  SUB_TIERS,
  type CompetitiveRank,
  type LoadType,
  type RankThresholds,
  type SubTier,
} from "./rank-config";

// ──────────────────────────────────────────────────────────────
// 1. Estimación de 1RM
// ──────────────────────────────────────────────────────────────

/** Nº de reps por encima del cual Epley pierde fiabilidad; se satura. */
const EPLEY_REP_CAP = 20;

/**
 * 1RM estimado mediante la fórmula de Epley:
 *   1RM = peso × (1 + reps / 30)
 *
 * Si se conoce el RIR (reps en reserva), se tratan las reps "reales" como
 * `reps + rir`, ya que el atleta pudo haber hecho esas repeticiones extra.
 * Esto estabiliza la estimación entre series llevadas al fallo y series
 * controladas.
 *
 * @param weightKg Peso manejado (carga externa o lastre).
 * @param reps     Repeticiones completadas.
 * @param rir      Reps en reserva (opcional).
 */
export function estimateOneRepMax(
  weightKg: number,
  reps: number,
  rir?: number | null,
): number {
  if (weightKg <= 0 || reps <= 0) return 0;
  const effectiveReps = Math.min(reps + (rir ?? 0), EPLEY_REP_CAP);
  // 1 rep "real" => 1RM es el propio peso.
  if (effectiveReps <= 1) return round2(weightKg);
  return round2(weightKg * (1 + effectiveReps / 30));
}

/**
 * Peso total desplazado en un ejercicio de peso corporal (con o sin lastre).
 * Es la base para estimar 1RM en calistenia lastrada.
 *
 * @param bodyWeightKg Peso corporal del atleta.
 * @param extraLoadKg  Lastre añadido (0 en peso corporal puro).
 */
export function totalMovedLoad(bodyWeightKg: number, extraLoadKg: number): number {
  return Math.max(0, bodyWeightKg) + Math.max(0, extraLoadKg);
}

// ──────────────────────────────────────────────────────────────
// 2. Fuerza relativa
// ──────────────────────────────────────────────────────────────

/**
 * Resultado del rendimiento de una serie reducido a la métrica con la que
 * se evalúa el ejercicio.
 */
export interface PerformanceScore {
  /** Métrica evaluada: ratio de fuerza relativa, reps estrictas o segundos. */
  metric: RankThresholds["metric"];
  /** Valor numérico comparable contra los umbrales del ejercicio. */
  value: number;
  /** 1RM estimado (kg) cuando aplica; null para isometrías/reps puras. */
  estimated1Rm: number | null;
}

export interface ScoreInput {
  loadType: LoadType;
  bodyWeightKg: number;
  /** Peso externo o lastre según el tipo de carga. */
  weightKg: number;
  reps: number;
  rir?: number | null;
  /** Segundos de isometría (solo ISOMETRIC_HOLD). */
  durationSec?: number | null;
}

/**
 * Convierte el rendimiento de una serie en un `PerformanceScore` según el
 * tipo de carga del ejercicio:
 *
 *  - EXTERNAL: ratio = 1RM estimado / peso corporal.
 *  - WEIGHTED_BODYWEIGHT: ratio = 1RM del (peso corporal + lastre) / peso corporal.
 *  - BODYWEIGHT_REPS: la métrica son las repeticiones estrictas (ajustadas por RIR).
 *  - ISOMETRIC_HOLD: la métrica son los segundos sostenidos.
 */
export function scorePerformance(input: ScoreInput): PerformanceScore {
  const bw = Math.max(1, input.bodyWeightKg); // evita división por cero

  switch (input.loadType) {
    case "EXTERNAL": {
      const oneRm = estimateOneRepMax(input.weightKg, input.reps, input.rir);
      return { metric: "ratio", value: round3(oneRm / bw), estimated1Rm: oneRm };
    }
    case "WEIGHTED_BODYWEIGHT": {
      const moved = totalMovedLoad(bw, input.weightKg);
      const oneRm = estimateOneRepMax(moved, input.reps, input.rir);
      return { metric: "ratio", value: round3(oneRm / bw), estimated1Rm: oneRm };
    }
    case "BODYWEIGHT_REPS": {
      const strictReps = Math.max(0, input.reps);
      return { metric: "reps", value: strictReps, estimated1Rm: null };
    }
    case "ISOMETRIC_HOLD": {
      const seconds = Math.max(0, input.durationSec ?? 0);
      return { metric: "seconds", value: seconds, estimated1Rm: null };
    }
  }
}

// ──────────────────────────────────────────────────────────────
// 3. Rangos (ejercicio, músculo, global)
// ──────────────────────────────────────────────────────────────

export interface RankResult {
  rank: CompetitiveRank;
  subTier: SubTier;
  /** Porcentaje 0-100 hacia el siguiente escalón (sub-nivel o rango). */
  progressPct: number;
  /** Puntuación normalizada 0-100 a través de los 9 rangos; útil para promedios. */
  normalizedScore: number;
}

/**
 * Dado un valor de métrica y los umbrales de un ejercicio, devuelve el rango,
 * el sub-nivel (I/II/III) y el porcentaje exacto hacia el siguiente escalón.
 *
 * Cada rango se divide en 3 sub-niveles equiespaciados entre su umbral y el
 * umbral del rango siguiente. El rango tope (SYMMETRIC) no tiene techo, así
 * que su progreso se mide contra una proyección del último tramo.
 */
export function computeRank(value: number, thresholds: RankThresholds): RankResult {
  const t = thresholds.thresholds;
  const ranks = COMPETITIVE_RANKS;

  // Por debajo del primer umbral: Hierro I con progreso parcial hacia Hierro.
  const firstThreshold = t[ranks[0]];
  if (value <= 0 || value < firstThreshold) {
    const pct = firstThreshold > 0 ? clampPct((value / firstThreshold) * 100) : 0;
    return {
      rank: "IRON",
      subTier: "I",
      progressPct: round1(pct),
      normalizedScore: round1((pct / 100) * bandWidth()),
    };
  }

  // Encuentra el rango alcanzado (el mayor cuyo umbral se supera).
  let rankIndex = 0;
  for (let i = 0; i < ranks.length; i++) {
    if (value >= t[ranks[i]!]) rankIndex = i;
    else break;
  }

  const currentRank = ranks[rankIndex]!;
  const lower = t[currentRank];

  // Techo del rango actual: umbral del siguiente rango, o proyección para el tope.
  const isTop = rankIndex === ranks.length - 1;
  const upper = isTop
    ? projectTopCeiling(lower, t[ranks[rankIndex - 1]!]!)
    : t[ranks[rankIndex + 1]!]!;

  const span = Math.max(upper - lower, 1e-9);
  const within = clamp01((value - lower) / span); // 0-1 dentro del rango

  // 3 sub-niveles equiespaciados.
  const tierIndex = Math.min(2, Math.floor(within * 3));
  const subTier = SUB_TIERS[tierIndex]!;

  // Progreso 0-100 dentro del sub-nivel actual hacia el siguiente escalón.
  const tierFloor = tierIndex / 3;
  const tierProgress = clampPct((within - tierFloor) * 3 * 100);

  // Puntuación normalizada 0-100 a lo largo de los 9 rangos (para promedios).
  const normalized = (rankIndex + within) * bandWidth();

  return {
    rank: currentRank,
    subTier,
    progressPct: round1(tierProgress),
    normalizedScore: round1(clampPct(normalized)),
  };
}

/** Ancho de banda de cada rango en la escala 0-100. */
function bandWidth(): number {
  return 100 / COMPETITIVE_RANKS.length;
}

/**
 * Proyecta un techo artificial para el rango tope usando el ancho del tramo
 * anterior, de modo que el progreso dentro de SYMMETRIC siga siendo legible.
 */
function projectTopCeiling(topThreshold: number, prevThreshold: number): number {
  const lastSpan = Math.max(topThreshold - prevThreshold, topThreshold * 0.15);
  return topThreshold + lastSpan;
}

/**
 * Convierte una puntuación normalizada 0-100 de vuelta a rango + sub-nivel.
 * Se usa para el rango por grupo muscular y el rango global, que se derivan
 * promediando puntuaciones normalizadas en lugar de métricas crudas.
 */
export function rankFromNormalizedScore(score: number): RankResult {
  const band = bandWidth();
  const clamped = clampPct(score);
  const rankIndex = Math.min(
    COMPETITIVE_RANKS.length - 1,
    Math.floor(clamped / band),
  );
  const rank = COMPETITIVE_RANKS[rankIndex]!;
  const within = clamp01((clamped - rankIndex * band) / band);
  const tierIndex = Math.min(2, Math.floor(within * 3));
  const subTier = SUB_TIERS[tierIndex]!;
  const tierFloor = tierIndex / 3;
  const tierProgress = clampPct((within - tierFloor) * 3 * 100);

  return {
    rank,
    subTier,
    progressPct: round1(tierProgress),
    normalizedScore: round1(clamped),
  };
}

export interface WeightedScore {
  /** Puntuación normalizada 0-100 del ejercicio. */
  normalizedScore: number;
  /** Peso del ejercicio en el promedio (p. ej. nº de series o prioridad). */
  weight: number;
}

/**
 * Rango de un grupo muscular: promedio ponderado de las puntuaciones
 * normalizadas de sus ejercicios principales.
 */
export function computeMuscleRank(scores: WeightedScore[]): RankResult {
  const total = scores.reduce((acc, s) => acc + Math.max(0, s.weight), 0);
  if (total <= 0) return rankFromNormalizedScore(0);
  const weighted =
    scores.reduce((acc, s) => acc + s.normalizedScore * Math.max(0, s.weight), 0) /
    total;
  return rankFromNormalizedScore(weighted);
}

/**
 * Rango global Vektor: promedio de las puntuaciones normalizadas de todos los
 * grupos musculares con datos. Penaliza ligeramente la dispersión para premiar
 * la simetría (coherente con la filosofía del rango tope "Simétrico").
 */
export function computeGlobalRank(muscleScores: number[]): RankResult {
  const valid = muscleScores.filter((s) => s > 0);
  if (valid.length === 0) return rankFromNormalizedScore(0);
  const mean = valid.reduce((a, b) => a + b, 0) / valid.length;
  const variance =
    valid.reduce((a, b) => a + (b - mean) ** 2, 0) / valid.length;
  const stdDev = Math.sqrt(variance);
  // Penalización por asimetría: hasta un 15% del std-dev, acotada.
  const symmetryPenalty = Math.min(mean * 0.15, stdDev * 0.3);
  return rankFromNormalizedScore(Math.max(0, mean - symmetryPenalty));
}

// ──────────────────────────────────────────────────────────────
// 4. Sobrecarga progresiva (doble progresión)
// ──────────────────────────────────────────────────────────────

export interface SessionSummary {
  /** Peso representativo de la serie efectiva más pesada de la sesión. */
  topWeightKg: number;
  /** Repeticiones de esa serie. */
  topReps: number;
  /** RIR de esa serie (si se registró). */
  rir: number | null;
}

export interface ProgressionContext {
  loadType: LoadType;
  repRangeMin: number;
  repRangeMax: number;
  /** Las últimas sesiones del ejercicio (más reciente primero), máx. 3 usadas. */
  recentSessions: SessionSummary[];
  /** Incremento de carga por defecto (kg). */
  incrementKg?: number;
}

export type ProgressionAction =
  | "INCREASE_LOAD"
  | "ADD_REP"
  | "HOLD"
  | "DELOAD"
  | "START";

export interface ProgressionRecommendation {
  action: ProgressionAction;
  /** Texto listo para la píldora de recomendación en el tracker. */
  message: string;
  /** Peso objetivo sugerido (kg); null cuando no cambia o no aplica. */
  targetWeightKg: number | null;
  /** Reps objetivo sugeridas; null cuando no cambia. */
  targetReps: number | null;
}

/** Umbral de RIR a partir del cual se considera que hay margen para progresar. */
const PROGRESSION_RIR_THRESHOLD = 2;

/**
 * Algoritmo determinístico de doble progresión. Evalúa hasta las 3 últimas
 * sesiones del ejercicio y devuelve una recomendación directa:
 *
 *  - Si se alcanzó el tope del rango de reps con RIR ≥ 2 → subir carga y
 *    volver al mínimo de reps.
 *  - Si aún no se alcanza el tope de reps → mantener carga e intentar +1 rep.
 *  - Si hay estancamiento/retroceso en 3 sesiones → sugerir deload.
 */
export function recommendProgression(
  ctx: ProgressionContext,
): ProgressionRecommendation {
  const sessions = ctx.recentSessions.slice(0, 3);
  const increment = ctx.incrementKg ?? defaultIncrement(ctx.loadType);

  if (sessions.length === 0) {
    return {
      action: "START",
      message: `Primera vez: busca ${ctx.repRangeMin}-${ctx.repRangeMax} reps con RIR 2 y registra tu referencia.`,
      targetWeightKg: null,
      targetReps: ctx.repRangeMax,
    };
  }

  const last = sessions[0]!;

  // Detección de estancamiento: 3 sesiones sin mejorar peso ni reps.
  if (sessions.length >= 3 && isStalled(sessions)) {
    const deloadWeight = round2(last.topWeightKg * 0.9);
    return {
      action: "DELOAD",
      message: `Estancamiento detectado en 3 sesiones. Descarga: baja a ${formatWeight(deloadWeight)} y reconstruye volumen.`,
      targetWeightKg: deloadWeight,
      targetReps: ctx.repRangeMax,
    };
  }

  const hitTopReps = last.topReps >= ctx.repRangeMax;
  const hasReserve =
    last.rir === null ? false : last.rir >= PROGRESSION_RIR_THRESHOLD;

  // Caso 1: tope de reps alcanzado con margen → subir carga.
  if (hitTopReps && (hasReserve || last.rir === null)) {
    const target = round2(last.topWeightKg + increment);
    return {
      action: "INCREASE_LOAD",
      message: `Objetivo hoy: subir a ${formatWeight(target)} (${ctx.repRangeMin}-${ctx.repRangeMax} reps).`,
      targetWeightKg: target,
      targetReps: ctx.repRangeMin,
    };
  }

  // Caso 2: tope de reps pero sin margen → consolidar antes de subir.
  if (hitTopReps && !hasReserve) {
    return {
      action: "HOLD",
      message: `Objetivo hoy: consolidar ${formatWeight(last.topWeightKg)} × ${ctx.repRangeMax} con mejor técnica y RIR ≥ 2.`,
      targetWeightKg: last.topWeightKg,
      targetReps: ctx.repRangeMax,
    };
  }

  // Caso 3: aún por debajo del tope de reps → añadir 1 rep.
  const nextReps = Math.min(last.topReps + 1, ctx.repRangeMax);
  return {
    action: "ADD_REP",
    message: `Objetivo hoy: mantener ${formatWeight(last.topWeightKg)} e intentar +1 rep (${nextReps} reps).`,
    targetWeightKg: last.topWeightKg,
    targetReps: nextReps,
  };
}

/** Un ejercicio está estancado si en 3 sesiones no sube peso ni reps. */
function isStalled(sessions: SessionSummary[]): boolean {
  const [a, b, c] = sessions;
  if (!a || !b || !c) return false;
  const noWeightGain = a.topWeightKg <= b.topWeightKg && b.topWeightKg <= c.topWeightKg;
  const noRepGain = a.topReps <= c.topReps + 0; // sin ganancia neta de reps
  // Estancado si el más reciente no supera al más antiguo en peso ni reps.
  return (
    a.topWeightKg <= c.topWeightKg && a.topReps <= c.topReps && noWeightGain && noRepGain
  );
}

/** Incremento de carga por defecto según el tipo de ejercicio. */
function defaultIncrement(loadType: LoadType): number {
  switch (loadType) {
    case "EXTERNAL":
      return 2.5;
    case "WEIGHTED_BODYWEIGHT":
      return 1.25;
    default:
      return 0; // reps/isometría no usan incremento de carga
  }
}

// ──────────────────────────────────────────────────────────────
// 5. Detección de PR y utilidades de sesión
// ──────────────────────────────────────────────────────────────

/**
 * Determina si una serie es un récord personal (PR) comparando su 1RM
 * estimado (o métrica equivalente) con el mejor histórico conocido.
 */
export function isPersonalRecord(
  currentScore: number,
  bestHistoricalScore: number,
): boolean {
  if (currentScore <= 0) return false;
  // Margen mínimo para evitar falsos positivos por redondeo.
  return currentScore > bestHistoricalScore * 1.0001;
}

/** Tonelaje de una serie (peso × reps). Para calistenia usa el peso movido. */
export function setTonnage(weightKg: number, reps: number): number {
  return round2(Math.max(0, weightKg) * Math.max(0, reps));
}

// ──────────────────────────────────────────────────────────────
// Helpers de presentación
// ──────────────────────────────────────────────────────────────

export function rankLabel(rank: CompetitiveRank): string {
  return RANK_META[rank].label;
}

export function rankColor(rank: CompetitiveRank): string {
  return RANK_META[rank].color;
}

function formatWeight(kg: number): string {
  const rounded = round2(kg);
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(2).replace(/0$/, "")} kg`;
}

// ──────────────────────────────────────────────────────────────
// Utilidades numéricas
// ──────────────────────────────────────────────────────────────

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function clampPct(n: number): number {
  return Math.min(100, Math.max(0, n));
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}
