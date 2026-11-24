"use client";

/**
 * Vektor — Shell de la aplicación.
 *
 * Alterna entre el Dashboard y el Modo Gimnasio, manteniendo el estado de
 * demostración (rango global, estados musculares, peso corporal). El Paso 4
 * sustituye estos datos por los de Supabase y la navegación por rutas reales.
 */

import { useMemo, useState } from "react";
import type { MuscleGroup } from "@/lib/rank-config";
import type { MuscleRankState } from "@/lib/ranking-engine";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { ActiveWorkout } from "@/components/workout/ActiveWorkout";
import { buildDemoSession } from "@/lib/demo-session";
import type { ActiveSessionState } from "@/lib/offline/useActiveSession";

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

export function VektorApp() {
  const [view, setView] = useState<"dashboard" | "workout">("dashboard");
  const [bodyWeightKg, setBodyWeightKg] = useState(80);
  const [session, setSession] = useState<ActiveSessionState | null>(null);

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
    <Dashboard
      global={global}
      muscleStates={DEMO_MUSCLES}
      weeklySets={DEMO_WEEKLY}
      bodyWeightKg={bodyWeightKg}
      onStartFreeWorkout={startFreeWorkout}
      onUpdateBodyWeight={(kg) => setBodyWeightKg(kg)}
    />
  );
}

export default VektorApp;
