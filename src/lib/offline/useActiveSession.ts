"use client";

/**
 * Vektor — Hook de sesión activa con persistencia resiliente.
 *
 * Mantiene la sesión de entrenamiento en estado de React y la vuelca a
 * IndexedDB en cada cambio (debounced mínimamente), de modo que cerrar la app o
 * perder señal en el gimnasio nunca pierde una serie. Al finalizar, encola la
 * sesión en el sync-manager para subirla a Supabase cuando haya red.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  saveSession,
  type LocalWorkoutSession,
  type LocalWorkoutSet,
} from "./db";
import { queueSessionUpload } from "./sync-manager";
import type { ActiveExercise } from "../workout-types";
import { setTonnage } from "../ranking-engine";

export interface ActiveSessionState {
  clientId: string;
  userId: string;
  routineDayId: string | null;
  name: string;
  startedAt: string;
  /** Peso corporal del atleta, para la fuerza relativa durante el entreno. */
  bodyWeightKg: number;
  exercises: ActiveExercise[];
}

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** Aplana la sesión activa al formato persistible en IndexedDB. */
function toLocalSession(
  session: ActiveSessionState,
  finished: boolean,
): LocalWorkoutSession {
  const sets: LocalWorkoutSet[] = [];
  let totalVolume = 0;
  let order = 0;

  for (const ex of session.exercises) {
    for (const s of ex.sets) {
      if (!s.completed) continue;
      totalVolume += setTonnage(s.weightKg, s.reps);
      sets.push({
        clientId: s.clientId,
        exerciseId: ex.exerciseId,
        setOrder: order++,
        setType: s.setType,
        weightKg: s.weightKg,
        reps: s.reps,
        rir: s.rir,
        durationSec: s.durationSec,
        estimated1Rm: s.estimated1Rm,
        isPr: s.isPr,
        rankAchieved: null,
      });
    }
  }

  const now = new Date();
  const startedMs = new Date(session.startedAt).getTime();

  return {
    clientId: session.clientId,
    userId: session.userId,
    routineDayId: session.routineDayId,
    name: session.name,
    startedAt: session.startedAt,
    finishedAt: finished ? now.toISOString() : null,
    durationSec: finished ? Math.round((now.getTime() - startedMs) / 1000) : null,
    totalVolumeKg: Math.round(totalVolume * 100) / 100,
    fatigueRpe: null,
    notes: null,
    sets,
    status: "pending",
    updatedAt: Date.now(),
  };
}

export function useActiveSession(initial: ActiveSessionState) {
  const [session, setSession] = useState<ActiveSessionState>(initial);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Autosave resiliente: cada cambio se persiste en IndexedDB (coalescido a 300ms).
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void saveSession(toLocalSession(session, false)).catch((err) =>
        console.error("[Vektor] autosave falló:", err),
      );
    }, 300);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [session]);

  const updateExercise = useCallback(
    (exerciseClientId: string, updater: (ex: ActiveExercise) => ActiveExercise) => {
      setSession((prev) => ({
        ...prev,
        exercises: prev.exercises.map((ex) =>
          ex.clientId === exerciseClientId ? updater(ex) : ex,
        ),
      }));
    },
    [],
  );

  const addExercise = useCallback((ex: ActiveExercise) => {
    setSession((prev) => ({ ...prev, exercises: [...prev.exercises, ex] }));
  }, []);

  /** Cierra la sesión: persiste como finalizada y la encola para sincronizar. */
  const finishSession = useCallback(async (): Promise<LocalWorkoutSession> => {
    const local = toLocalSession(session, true);
    await saveSession(local);
    await queueSessionUpload(local);
    return local;
  }, [session]);

  return {
    session,
    setSession,
    updateExercise,
    addExercise,
    finishSession,
    newId: uuid,
  };
}
