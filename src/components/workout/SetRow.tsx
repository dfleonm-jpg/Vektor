"use client";

/**
 * Vektor — Fila de serie del tracker.
 *
 * Ergonomía de una sola mano: steppers grandes para peso (pasos seleccionables
 * 1.25/2.5 kg, o 0 en peso corporal puro) y reps (±1), chips de RIR y tipo de
 * serie, y check para completar (dispara el temporizador de descanso).
 * Los números van en JetBrains Mono tabular.
 */

import {
  isIsometric,
  usesExternalWeight,
  type ActiveExercise,
  type ActiveSet,
  type SetType,
} from "../../lib/workout-types";
import { IsometricTimer } from "./IsometricTimer";

const SET_TYPES: { value: SetType; label: string; title: string }[] = [
  { value: "WARMUP", label: "W", title: "Calentamiento" },
  { value: "WORKING", label: "S", title: "Efectiva" },
  { value: "DROPSET", label: "D", title: "Drop-set" },
  { value: "FAILURE", label: "F", title: "Al fallo" },
];

const RIR_OPTIONS = [0, 1, 2, 3, 4];

export interface SetRowProps {
  exercise: ActiveExercise;
  set: ActiveSet;
  index: number;
  /** Paso de peso seleccionado (1.25 o 2.5). */
  weightStep: number;
  onChange: (next: ActiveSet) => void;
  onComplete: (set: ActiveSet) => void;
}

export function SetRow({
  exercise,
  set,
  index,
  weightStep,
  onChange,
  onComplete,
}: SetRowProps) {
  const iso = isIsometric(exercise.loadType);
  const canWeight = usesExternalWeight(exercise.loadType);

  const patch = (p: Partial<ActiveSet>) => onChange({ ...set, ...p });

  return (
    <div
      className={`rounded-xl border p-3 transition-colors ${
        set.completed
          ? "border-emerald-500/40 bg-emerald-500/5"
          : "border-zinc-800 bg-zinc-900/40"
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-xs tabular-nums text-[#A1A1AA]">
          Serie {index + 1}
        </span>
        <div className="flex gap-1">
          {SET_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              title={t.title}
              onClick={() => patch({ setType: t.value })}
              className={`h-7 w-7 rounded-md text-xs font-bold active:scale-95 ${
                set.setType === t.value
                  ? "bg-[#3B82F6] text-white"
                  : "bg-zinc-800 text-[#A1A1AA]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {iso ? (
        <IsometricTimer
          value={set.durationSec ?? 0}
          onChange={(s) => patch({ durationSec: s })}
        />
      ) : (
        <div className="flex items-stretch gap-3">
          {/* Peso */}
          <Stepper
            label="Peso (kg)"
            value={set.weightKg}
            disabled={!canWeight}
            onDec={() => patch({ weightKg: Math.max(0, round(set.weightKg - weightStep)) })}
            onInc={() => patch({ weightKg: round(set.weightKg + weightStep) })}
            display={canWeight ? set.weightKg.toString() : "PC"}
          />
          {/* Reps */}
          <Stepper
            label="Reps"
            value={set.reps}
            onDec={() => patch({ reps: Math.max(0, set.reps - 1) })}
            onInc={() => patch({ reps: set.reps + 1 })}
            display={set.reps.toString()}
          />
        </div>
      )}

      {/* RIR */}
      <div className="mt-3">
        <p className="mb-1 text-[11px] uppercase tracking-wide text-[#A1A1AA]">
          RIR (reps en reserva)
        </p>
        <div className="flex gap-1.5">
          {RIR_OPTIONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => patch({ rir: r })}
              className={`flex-1 rounded-lg py-1.5 font-mono text-sm tabular-nums active:scale-95 ${
                set.rir === r
                  ? "bg-[#00E5FF] font-bold text-[#09090B]"
                  : "bg-zinc-800 text-[#A1A1AA]"
              }`}
            >
              {r === 4 ? "4+" : r}
            </button>
          ))}
        </div>
      </div>

      {/* Completar */}
      <button
        type="button"
        onClick={() => {
          const next = { ...set, completed: !set.completed };
          onChange(next);
          if (next.completed) onComplete(next);
        }}
        className={`mt-3 w-full rounded-xl py-2.5 text-sm font-semibold active:scale-95 ${
          set.completed
            ? "bg-emerald-500/20 text-emerald-300"
            : "bg-[#FAFAFA] text-[#09090B]"
        }`}
      >
        {set.completed ? "✓ Completada" : "Marcar serie"}
      </button>
    </div>
  );
}

function Stepper({
  label,
  display,
  onDec,
  onInc,
  disabled,
}: {
  label: string;
  value: number;
  display: string;
  onDec: () => void;
  onInc: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex-1">
      <p className="mb-1 text-center text-[11px] uppercase tracking-wide text-[#A1A1AA]">
        {label}
      </p>
      <div className="flex items-center gap-2">
        <StepBtn onClick={onDec} disabled={disabled}>
          −
        </StepBtn>
        <span className="flex-1 text-center font-mono text-3xl font-bold tabular-nums text-[#FAFAFA]">
          {display}
        </span>
        <StepBtn onClick={onInc} disabled={disabled}>
          +
        </StepBtn>
      </div>
    </div>
  );
}

function StepBtn({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="h-11 w-11 shrink-0 rounded-xl bg-zinc-800 text-2xl font-bold text-[#FAFAFA] active:scale-90 disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

export default SetRow;
