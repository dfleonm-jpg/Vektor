/**
 * Vektor — Generador de sesión de demostración para el tracker.
 *
 * Mientras no hay backend conectado (Supabase llega en el Paso 4), produce una
 * sesión "Push" con ejercicios reales del catálogo, umbrales reales y un
 * historial simulado para ejercitar la píldora de progresión y la detección de
 * PR. El Paso 4 reemplaza esto por datos de la base de datos.
 */

import { ratioThresholds, repThresholds } from "../../prisma/rank-thresholds";
import type { ActiveSessionState } from "./offline/useActiveSession";

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function buildDemoSession(bodyWeightKg = 80): ActiveSessionState {
  return {
    clientId: uuid(),
    userId: "demo-user",
    routineDayId: null,
    name: "Entrenamiento libre · Push",
    startedAt: new Date().toISOString(),
    bodyWeightKg,
    exercises: [
      {
        clientId: uuid(),
        exerciseId: "barbell-bench-press",
        name: "Press de banca con barra",
        primaryMuscle: "CHEST",
        loadType: "EXTERNAL",
        rankThresholds: ratioThresholds(0.5, 2.0),
        repRangeMin: 6,
        repRangeMax: 8,
        restSeconds: 120,
        bestHistoricalScore: 1.1, // 1RM ≈ 88 kg a BW 80 → ratio 1.1
        recentSessions: [{ topWeightKg: 75, topReps: 8, rir: 2 }],
        lastSessionLabel: "75 kg × 8 @ RIR 2",
        sets: [
          {
            clientId: uuid(),
            setType: "WORKING",
            weightKg: 77.5,
            reps: 6,
            rir: null,
            durationSec: null,
            completed: false,
            estimated1Rm: null,
            isPr: false,
          },
        ],
      },
      {
        clientId: uuid(),
        exerciseId: "overhead-press",
        name: "Press militar con barra",
        primaryMuscle: "FRONT_DELTS",
        loadType: "EXTERNAL",
        rankThresholds: ratioThresholds(0.4, 1.4),
        repRangeMin: 6,
        repRangeMax: 10,
        restSeconds: 120,
        bestHistoricalScore: 0.62,
        recentSessions: [{ topWeightKg: 45, topReps: 9, rir: 1 }],
        lastSessionLabel: "45 kg × 9 @ RIR 1",
        sets: [
          {
            clientId: uuid(),
            setType: "WORKING",
            weightKg: 45,
            reps: 10,
            rir: null,
            durationSec: null,
            completed: false,
            estimated1Rm: null,
            isPr: false,
          },
        ],
      },
      {
        clientId: uuid(),
        exerciseId: "parallel-bar-dip",
        name: "Fondos en paralelas",
        primaryMuscle: "TRICEPS",
        loadType: "BODYWEIGHT_REPS",
        rankThresholds: repThresholds(1, 35),
        repRangeMin: 8,
        repRangeMax: 15,
        restSeconds: 90,
        bestHistoricalScore: 14,
        recentSessions: [{ topWeightKg: 0, topReps: 14, rir: 2 }],
        lastSessionLabel: "Peso corporal × 14 @ RIR 2",
        sets: [
          {
            clientId: uuid(),
            setType: "WORKING",
            weightKg: 0,
            reps: 15,
            rir: null,
            durationSec: null,
            completed: false,
            estimated1Rm: null,
            isPr: false,
          },
        ],
      },
    ],
  };
}
