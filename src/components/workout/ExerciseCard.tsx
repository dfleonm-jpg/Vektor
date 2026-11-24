"use client";

/**
 * Vektor — Tarjeta de ejercicio en el tracker.
 *
 * Reúne por ejercicio: nombre, historial inline de la última sesión, la píldora
 * de doble progresión (calculada por el motor), las filas de serie y un botón
 * para añadir serie. El peso por defecto de una serie nueva parte del objetivo
 * de la recomendación de progresión.
 */

import { useMemo } from "react";
import {
  recommendProgression,
  type ProgressionAction,
} from "../../lib/ranking-engine";
import { isIsometric, type ActiveExercise, type ActiveSet } from "../../lib/workout-types";
import { SetRow } from "./SetRow";

const ACTION_COLOR: Record<ProgressionAction, string> = {
  INCREASE_LOAD: "#10B981",
  ADD_REP: "#3B82F6",
  HOLD: "#EAB308",
  DELOAD: "#F43F5E",
  START: "#A1A1AA",
};

export interface ExerciseCardProps {
  exercise: ActiveExercise;
  weightStep: number;
  onUpdate: (updater: (ex: ActiveExercise) => ActiveExercise) => void;
  onSetCompleted: (exercise: ActiveExercise, set: ActiveSet) => void;
  newId: () => string;
}

export function ExerciseCard({
  exercise,
  weightStep,
  onUpdate,
  onSetCompleted,
  newId,
}: ExerciseCardProps) {
  const recommendation = useMemo(
    () =>
      recommendProgression({
        loadType: exercise.loadType,
        repRangeMin: exercise.repRangeMin,
        repRangeMax: exercise.repRangeMax,
        recentSessions: exercise.recentSessions,
      }),
    [exercise],
  );

  const addSet = () => {
    const last = exercise.sets[exercise.sets.length - 1];
    const newSet: ActiveSet = {
      clientId: newId(),
      setType: "WORKING",
      weightKg: recommendation.targetWeightKg ?? last?.weightKg ?? 0,
      reps: recommendation.targetReps ?? last?.reps ?? exercise.repRangeMin,
      rir: null,
      durationSec: isIsometric(exercise.loadType) ? 0 : null,
      completed: false,
      estimated1Rm: null,
      isPr: false,
    };
    onUpdate((ex) => ({ ...ex, sets: [...ex.sets, newSet] }));
  };

  const updateSet = (clientId: string, next: ActiveSet) => {
    onUpdate((ex) => ({
      ...ex,
      sets: ex.sets.map((s) => (s.clientId === clientId ? next : s)),
    }));
  };

  return (
    <section className="rounded-2xl border border-zinc-800 bg-[#121215] p-4">
      <header className="mb-3">
        <h2 className="text-base font-semibold text-[#FAFAFA]">{exercise.name}</h2>
        {exercise.lastSessionLabel && (
          <p className="mt-0.5 font-mono text-xs tabular-nums text-[#A1A1AA]">
            Anterior: {exercise.lastSessionLabel}
          </p>
        )}
      </header>

      {/* Píldora de doble progresión */}
      <div
        className="mb-4 flex items-start gap-2 rounded-xl px-3 py-2"
        style={{
          backgroundColor: `${ACTION_COLOR[recommendation.action]}14`,
          border: `1px solid ${ACTION_COLOR[recommendation.action]}44`,
        }}
      >
        <span
          className="mt-0.5 text-sm"
          style={{ color: ACTION_COLOR[recommendation.action] }}
          aria-hidden
        >
          ◈
        </span>
        <p className="text-sm text-[#FAFAFA]">{recommendation.message}</p>
      </div>

      <div className="space-y-2.5">
        {exercise.sets.map((set, i) => (
          <SetRow
            key={set.clientId}
            exercise={exercise}
            set={set}
            index={i}
            weightStep={weightStep}
            onChange={(next) => updateSet(set.clientId, next)}
            onComplete={(next) => onSetCompleted(exercise, next)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={addSet}
        className="mt-3 w-full rounded-xl border border-dashed border-zinc-700 py-2.5 text-sm font-medium text-[#A1A1AA] active:scale-95"
      >
        + Añadir serie
      </button>
    </section>
  );
}

export default ExerciseCard;
