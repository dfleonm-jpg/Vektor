"use client";

/**
 * Vektor — Tarjeta de rutina previsualizable (salida del Coach IA).
 *
 * Renderiza la rutina estructurada que el Coach propone y ofrece guardarla en
 * "Mis Rutinas" (persiste en Routine/RoutineDay/RoutineExercise vía /api/sync).
 */

import { useState } from "react";
import type { RoutineInput } from "../../lib/schemas";

export interface RoutinePreviewCardProps {
  routine: RoutineInput;
  rationale?: string;
  onSave: (routine: RoutineInput) => Promise<void>;
}

export function RoutinePreviewCard({
  routine,
  rationale,
  onSave,
}: RoutinePreviewCardProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await onSave(routine);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[#3B82F6]/40 bg-[#0d1117] p-4">
      <h3 className="text-base font-bold text-[#FAFAFA]">{routine.name}</h3>
      {routine.description && (
        <p className="mt-0.5 text-xs text-[#A1A1AA]">{routine.description}</p>
      )}

      <div className="mt-3 space-y-3">
        {routine.days.map((day, i) => (
          <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
            <p className="mb-2 text-sm font-semibold text-[#00E5FF]">{day.name}</p>
            <ul className="space-y-1">
              {day.exercises.map((ex, j) => (
                <li
                  key={j}
                  className="flex items-center justify-between font-mono text-xs tabular-nums text-[#A1A1AA]"
                >
                  <span className="truncate text-[#FAFAFA]">{ex.exerciseSlug}</span>
                  <span>
                    {ex.targetSets}×{ex.repRangeMin}-{ex.repRangeMax} · {ex.restSeconds}s
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {rationale && (
        <p className="mt-3 text-xs italic text-[#A1A1AA]">{rationale}</p>
      )}

      <button
        type="button"
        onClick={save}
        disabled={saving || saved}
        className="mt-4 w-full rounded-xl bg-[#3B82F6] py-2.5 text-sm font-semibold text-white active:scale-[0.98] disabled:opacity-50"
      >
        {saved ? "✓ Guardada en Mis Rutinas" : saving ? "Guardando…" : "Guardar en Mis Rutinas"}
      </button>
    </div>
  );
}

export default RoutinePreviewCard;
