/**
 * Vektor — Esquemas Zod compartidos.
 *
 * Contrato validado entre el cliente offline, el sync worker (/api/sync) y el
 * Vektor Coach (/api/coach). Validar en el borde evita escribir basura en
 * Supabase y garantiza que las rutinas generadas por IA mapean a ejercicios
 * reales del catálogo.
 */

import { z } from "zod";
import { COMPETITIVE_RANKS, MUSCLE_GROUPS } from "./rank-config";

export const setTypeSchema = z.enum(["WARMUP", "WORKING", "DROPSET", "FAILURE"]);

export const workoutSetSchema = z.object({
  clientId: z.string().min(1),
  exerciseId: z.string().min(1),
  setOrder: z.number().int().nonnegative(),
  setType: setTypeSchema,
  weightKg: z.number().nonnegative(),
  reps: z.number().int().nonnegative(),
  rir: z.number().int().nullable(),
  durationSec: z.number().int().nullable(),
  estimated1Rm: z.number().nullable(),
  isPr: z.boolean(),
  rankAchieved: z.enum(COMPETITIVE_RANKS).nullable(),
});

export const workoutSessionSchema = z.object({
  clientId: z.string().min(1),
  userId: z.string().min(1),
  routineDayId: z.string().nullable(),
  name: z.string().min(1),
  startedAt: z.string(),
  finishedAt: z.string().nullable(),
  durationSec: z.number().int().nullable(),
  totalVolumeKg: z.number().nonnegative(),
  fatigueRpe: z.number().nullable(),
  notes: z.string().nullable(),
  sets: z.array(workoutSetSchema),
});

export const bodyWeightLogSchema = z.object({
  userId: z.string().min(1),
  weightKg: z.number().positive(),
  bodyFatPct: z.number().positive().nullable().optional(),
  recordedAt: z.string(),
  /** Id de cliente para idempotencia. */
  clientId: z.string().min(1),
});

/** Operación de sincronización que llega a /api/sync. */
export const syncOperationSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("UPSERT_SESSION"), payload: workoutSessionSchema }),
  z.object({ type: z.literal("LOG_BODY_WEIGHT"), payload: bodyWeightLogSchema }),
  z.object({ type: z.literal("SAVE_ROUTINE"), payload: z.lazy(() => routineSchema) }),
]);

// ─────────────────────────── Rutinas (Coach IA) ───────────────────────────

export const routineExerciseSchema = z.object({
  /** Debe coincidir con un slug real del catálogo. */
  exerciseSlug: z.string().min(1),
  exerciseOrder: z.number().int().nonnegative().default(0),
  targetSets: z.number().int().min(1).max(10).default(3),
  repRangeMin: z.number().int().min(1).max(100).default(6),
  repRangeMax: z.number().int().min(1).max(100).default(12),
  restSeconds: z.number().int().min(15).max(600).default(120),
  targetRir: z.number().int().min(0).max(6).nullable().default(2),
});

export const routineDaySchema = z.object({
  name: z.string().min(1),
  dayOrder: z.number().int().nonnegative().default(0),
  exercises: z.array(routineExerciseSchema).min(1),
});

export const routineSchema = z.object({
  userId: z.string().min(1).optional(),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  days: z.array(routineDaySchema).min(1),
});

/** Salida estructurada del Coach al proponer una rutina. */
export const coachRoutineOutputSchema = z.object({
  kind: z.literal("routine"),
  routine: routineSchema,
  rationale: z.string().optional(),
});

export const muscleGroupSchema = z.enum(MUSCLE_GROUPS);

export type WorkoutSessionInput = z.infer<typeof workoutSessionSchema>;
export type BodyWeightLogInput = z.infer<typeof bodyWeightLogSchema>;
export type SyncOperationInput = z.infer<typeof syncOperationSchema>;
export type RoutineInput = z.infer<typeof routineSchema>;
export type CoachRoutineOutput = z.infer<typeof coachRoutineOutputSchema>;
