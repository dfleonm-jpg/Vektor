"use client";

/**
 * Vektor — Shell de la aplicación.
 *
 * Alterna entre el Dashboard y el Modo Gimnasio, manteniendo el estado de
 * demostración (rango global, estados musculares, peso corporal). El Paso 4
 * sustituye estos datos por los de Supabase y la navegación por rutas reales.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import type { MuscleGroup } from "@/lib/rank-config";
import type { MuscleRankState } from "@/lib/ranking-engine";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { ActiveWorkout } from "@/components/workout/ActiveWorkout";
import { CoachDrawer } from "@/components/coach/CoachDrawer";
import { buildDemoSession } from "@/lib/demo-session";
import type { ActiveSessionState } from "@/lib/offline/useActiveSession";
import { queueBodyWeight, queueRoutineSave } from "@/lib/offline/sync-manager";
import type { RoutineInput } from "@/lib/schemas";

const DEMO_MUSCLES: Partial<Record<MuscleGroup, MuscleRankState>> = {
  CHEST: {
    rank: "DIAMOND",
    subTier: "II",
    progressPct: 92,
    normalizedScore: 70,
    weeklySets: 16,
    bestPrLabel: "110 kg × 3",
    exercises: ["Press de banca con barra", "Press inclinado con barra"],
    hasData: true,
  },
  QUADS: {
    rank: "EMERALD",
    subTier: "I",
    progressPct: 40,
    normalizedScore: 58,
    weeklySets: 14,
    bestPrLabel: "160 kg × 2",
    exercises: ["Sentadilla con barra"],
    hasData: true,
  },
  BICEPS: {
    rank: "BRONZE",
    subTier: "III",
    progressPct: 30,
    normalizedScore: 20,
    weeklySets: 6,
    bestPrLabel: "22 kg × 6",
    exercises: ["Curl de bíceps con barra"],
    hasData: true,
  },
  CORE: {
    rank: "GOLD",
    subTier: "II",
    progressPct: 88,
    normalizedScore: 45,
    weeklySets: 9,
    bestPrLabel: "L-sit 32 s",
    exercises: ["L-sit", "Plancha abdominal"],
    hasData: true,
  },
};

const DEMO_WEEKLY: Partial<Record<MuscleGroup, number>> = {
  CHEST: 16,
  QUADS: 14,
  CORE: 9,
  BICEPS: 6,
  TRICEPS: 12,
  LATS: 18,
};

const DEMO_USER_ID = "00000000-0000-0000-0000-000000000000";

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function VektorApp() {
  const [view, setView] = useState<"dashboard" | "workout">("dashboard");
  const [bodyWeightKg, setBodyWeightKg] = useState(80);
  const [session, setSession] = useState<ActiveSessionState | null>(null);
  const [coachOpen, setCoachOpen] = useState(false);

  // El rango global demo tiene asimetría (bíceps muy por debajo) → penalización.
  const global = useMemo(
    () => ({
      rank: "PLATINUM" as const,
      subTier: "II" as const,
      progressPct: 23.8,
      normalizedScore: 49,
      asymmetryPenalty: true,
    }),
    [],
  );

  const startFreeWorkout = () => {
    setSession(buildDemoSession(bodyWeightKg));
    setView("workout");
  };

  // Persistencia offline-first: peso corporal y rutinas se encolan y sincronizan.
  const handleUpdateBodyWeight = async (kg: number) => {
    setBodyWeightKg(kg);
    await queueBodyWeight({
      userId: DEMO_USER_ID,
      weightKg: kg,
      recordedAt: new Date().toISOString(),
      clientId: uuid(),
    });
  };

  const handleSaveRoutine = async (routine: RoutineInput) => {
    await queueRoutineSave(uuid(), { ...routine, userId: DEMO_USER_ID });
  };

  // Contexto compacto para el Coach (demo; el Paso de auth lo alimenta real).
  const coachContext = useMemo(
    () => ({
      perfil: {
        pesoCorporalKg: bodyWeightKg,
        objetivo: "HYPERTROPHY",
        rangoGlobal: `${global.rank} ${global.subTier}`,
        progresoRangoGlobalPct: global.progressPct,
      },
      musculosDeRezagadoAFuerte: Object.entries(DEMO_MUSCLES).map(([g, s]) => ({
        musculo: g,
        rango: `${s!.rank} ${s!.subTier}`,
        series7d: s!.weeklySets,
        rezagado: s!.normalizedScore < global.normalizedScore - 11,
      })),
      rangoOptimoSeriesSemana: { min: 10, max: 20 },
    }),
    [bodyWeightKg, global],
  );

  if (view === "workout" && session) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setView("dashboard")}
          className="mx-auto mt-3 block max-w-md px-4 text-left text-sm text-[#A1A1AA]"
        >
          ‹ Volver al dashboard
        </button>
        <ActiveWorkout
          initialSession={session}
          onFinished={() => setView("dashboard")}
        />
      </div>
    );
  }

  return (
    <>
      <Dashboard
        global={global}
        muscleStates={DEMO_MUSCLES}
        weeklySets={DEMO_WEEKLY}
        bodyWeightKg={bodyWeightKg}
        onStartFreeWorkout={startFreeWorkout}
        onUpdateBodyWeight={handleUpdateBodyWeight}
      />

      {/* Enlace a analítica */}
      <div className="mx-auto max-w-md px-4 pb-24">
        <Link
          href="/analytics"
          className="flex w-full items-center justify-center rounded-2xl border border-zinc-800 bg-[#121215] py-3 text-sm font-semibold text-[#FAFAFA] active:scale-[0.98]"
        >
          Ver analítica y récords ›
        </Link>
      </div>

      {/* Botón flotante del Coach */}
      <button
        type="button"
        onClick={() => setCoachOpen(true)}
        className="fixed bottom-5 right-5 z-20 rounded-full bg-[#3B82F6] px-5 py-3 text-sm font-bold text-white shadow-lg active:scale-95"
      >
        Coach ◈
      </button>

      <CoachDrawer
        open={coachOpen}
        onClose={() => setCoachOpen(false)}
        context={coachContext}
        onSaveRoutine={handleSaveRoutine}
      />
    </>
  );
}

export default VektorApp;
