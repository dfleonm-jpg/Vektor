"use client";

/**
 * Vektor — Resumen rápido de volumen semanal efectivo por músculo.
 *
 * Muestra las series efectivas de los últimos 7 días frente al rango óptimo de
 * hipertrofia (10-20), con una barra por músculo coloreada según esté por
 * debajo, en zona óptima o por encima.
 */

import {
  classifyWeeklyVolume,
  OPTIMAL_WEEKLY_SETS,
  type VolumeStatus,
} from "../../lib/ranking-engine";
import { MUSCLE_LABELS, type MuscleGroup } from "../../lib/rank-config";

export interface WeeklyVolumeSummaryProps {
  /** Series efectivas por músculo en los últimos 7 días. */
  weeklySets: Partial<Record<MuscleGroup, number>>;
}

const STATUS_COLOR: Record<VolumeStatus, string> = {
  UNDER: "#A1A1AA",
  OPTIMAL: "#10B981",
  OVER: "#EAB308",
};

export function WeeklyVolumeSummary({ weeklySets }: WeeklyVolumeSummaryProps) {
  const entries = (Object.entries(weeklySets) as [MuscleGroup, number][])
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1]);

  if (entries.length === 0) {
    return (
      <section className="rounded-2xl border border-zinc-800 bg-[#121215] p-4">
        <h2 className="mb-1 text-sm font-semibold">Volumen semanal</h2>
        <p className="text-xs text-[#A1A1AA]">
          Aún sin series esta semana. Inicia un entrenamiento para empezar a
          acumular volumen efectivo.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-zinc-800 bg-[#121215] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Volumen semanal efectivo</h2>
        <span className="font-mono text-xs tabular-nums text-[#A1A1AA]">
          óptimo {OPTIMAL_WEEKLY_SETS.min}–{OPTIMAL_WEEKLY_SETS.max}
        </span>
      </div>
      <ul className="space-y-2">
        {entries.map(([muscle, sets]) => {
          const status = classifyWeeklyVolume(sets);
          const color = STATUS_COLOR[status];
          const pct = Math.min(100, (sets / OPTIMAL_WEEKLY_SETS.max) * 100);
          return (
            <li key={muscle} className="flex items-center gap-3">
              <span className="w-28 shrink-0 truncate text-xs text-[#A1A1AA]">
                {MUSCLE_LABELS[muscle]}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
              <span
                className="w-6 text-right font-mono text-xs tabular-nums"
                style={{ color }}
              >
                {sets}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default WeeklyVolumeSummary;
