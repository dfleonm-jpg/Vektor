"use client";

/**
 * Vektor — Dashboard principal.
 *
 * Pieza central de navegación: rango global, mapa anatómico interactivo,
 * resumen de volumen semanal, estado de sync y accesos directos para iniciar
 * entrenamiento (libre o desde rutina) y actualizar el peso corporal.
 */

import { useState } from "react";
import type { CompetitiveRank, MuscleGroup, SubTier } from "../../lib/rank-config";
import type { MuscleRankState } from "../../lib/ranking-engine";
import { AnatomyMap } from "../anatomy/AnatomyMap";
import { GlobalRankHeader } from "./GlobalRankHeader";
import { WeeklyVolumeSummary } from "./WeeklyVolumeSummary";
import { BodyWeightSheet } from "./BodyWeightSheet";
import { SyncBadge } from "./SyncBadge";
import { useSyncStatus } from "../../lib/offline/useSyncStatus";

export interface DashboardProps {
  global: {
    rank: CompetitiveRank;
    subTier: SubTier;
    progressPct: number;
    normalizedScore: number;
    asymmetryPenalty: boolean;
  };
  muscleStates: Partial<Record<MuscleGroup, MuscleRankState>>;
  weeklySets: Partial<Record<MuscleGroup, number>>;
  bodyWeightKg: number;
  onStartFreeWorkout: () => void;
  onStartRoutine?: () => void;
  onUpdateBodyWeight: (weightKg: number) => void | Promise<void>;
}

export function Dashboard({
  global,
  muscleStates,
  weeklySets,
  bodyWeightKg,
  onStartFreeWorkout,
  onStartRoutine,
  onUpdateBodyWeight,
}: DashboardProps) {
  const sync = useSyncStatus();
  const [weightSheet, setWeightSheet] = useState(false);

  return (
    <main className="mx-auto max-w-md space-y-4 px-4 py-5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#A1A1AA]">
          {new Date().toLocaleDateString("es", {
            weekday: "long",
            day: "numeric",
            month: "short",
          })}
        </span>
        <SyncBadge online={sync.online} pending={sync.pending} />
      </div>

      <GlobalRankHeader
        rank={global.rank}
        subTier={global.subTier}
        progressPct={global.progressPct}
        asymmetryPenalty={global.asymmetryPenalty}
      />

      {/* Acción rápida: peso corporal */}
      <button
        type="button"
        onClick={() => setWeightSheet(true)}
        className="flex w-full items-center justify-between rounded-xl border border-zinc-800 bg-[#121215] px-4 py-3 active:scale-[0.99]"
      >
        <span className="text-sm text-[#A1A1AA]">Peso corporal</span>
        <span className="font-mono text-base font-semibold tabular-nums text-[#FAFAFA]">
          {bodyWeightKg.toFixed(1)} kg ›
        </span>
      </button>

      {/* Mapa anatómico — centro de navegación */}
      <section className="rounded-2xl border border-zinc-800 bg-[#121215] p-4">
        <AnatomyMap states={muscleStates} globalScore={global.normalizedScore} />
      </section>

      <WeeklyVolumeSummary weeklySets={weeklySets} />

      {/* Acciones directas */}
      <div className="grid grid-cols-1 gap-2.5">
        <button
          type="button"
          onClick={onStartFreeWorkout}
          className="w-full rounded-2xl bg-[#3B82F6] py-3.5 text-base font-bold text-white active:scale-[0.98]"
        >
          Iniciar Entrenamiento Libre
        </button>
        <button
          type="button"
          onClick={onStartRoutine}
          disabled={!onStartRoutine}
          className="w-full rounded-2xl border border-zinc-800 bg-[#121215] py-3.5 text-base font-semibold text-[#FAFAFA] active:scale-[0.98] disabled:opacity-40"
        >
          Empezar desde una rutina
        </button>
      </div>

      <BodyWeightSheet
        open={weightSheet}
        currentKg={bodyWeightKg}
        onClose={() => setWeightSheet(false)}
        onSave={onUpdateBodyWeight}
      />
    </main>
  );
}

export default Dashboard;
