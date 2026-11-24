"use client";

/**
 * Vektor — Modo Gimnasio (tracker de entrenamiento activo).
 *
 * Orquesta la sesión en vivo:
 *   - Persistencia resiliente en IndexedDB en cada cambio (useActiveSession).
 *   - Al completar una serie efectiva: puntúa con el motor, detecta PR y subida
 *     de rango del ejercicio, dispara micro-celebración y el temporizador de
 *     descanso.
 *   - Al finalizar: encola la sesión para sincronizar con Supabase.
 *
 * Todo funciona sin conexión; el indicador de sync refleja el estado.
 */

import { useCallback, useState } from "react";
import {
  computeRank,
  isPersonalRecord,
  scorePerformance,
  rankLabel,
  rankColor,
} from "../../lib/ranking-engine";
import { RANK_META } from "../../lib/rank-config";
import {
  useActiveSession,
  type ActiveSessionState,
} from "../../lib/offline/useActiveSession";
import { useSyncStatus } from "../../lib/offline/useSyncStatus";
import type { ActiveExercise, ActiveSet } from "../../lib/workout-types";
import { ExerciseCard } from "./ExerciseCard";
import { RestTimer } from "./RestTimer";
import { CelebrationToast, type Celebration } from "./CelebrationToast";
import { SyncBadge } from "../dashboard/SyncBadge";

export interface ActiveWorkoutProps {
  initialSession: ActiveSessionState;
  onFinished?: (summary: { totalVolumeKg: number; sets: number }) => void;
}

const WEIGHT_STEPS = [1.25, 2.5];

export function ActiveWorkout({ initialSession, onFinished }: ActiveWorkoutProps) {
  const { session, updateExercise, finishSession, newId } =
    useActiveSession(initialSession);
  const sync = useSyncStatus();

  const [weightStep, setWeightStep] = useState(2.5);
  const [restSeconds, setRestSeconds] = useState<number | null>(null);
  const [restNonce, setRestNonce] = useState(0);
  const [celebration, setCelebration] = useState<Celebration | null>(null);
  const [finishing, setFinishing] = useState(false);

  const handleSetCompleted = useCallback(
    (exercise: ActiveExercise, set: ActiveSet) => {
      // 1) Puntuar la serie con el motor.
      const score = scorePerformance({
        loadType: exercise.loadType,
        bodyWeightKg: initialSession.bodyWeightKg,
        weightKg: set.weightKg,
        reps: set.reps,
        rir: set.rir,
        durationSec: set.durationSec,
      });

      // 2) Rango del ejercicio antes y después de esta serie.
      const prevRank = computeRank(exercise.bestHistoricalScore, exercise.rankThresholds);
      const newRank = computeRank(score.value, exercise.rankThresholds);
      const pr = isPersonalRecord(score.value, exercise.bestHistoricalScore);
      const rankedUp =
        RANK_META[newRank.rank].order > RANK_META[prevRank.rank].order ||
        (newRank.rank === prevRank.rank &&
          newRank.subTier > prevRank.subTier &&
          pr);

      // 3) Persistir 1RM/PR en la serie y actualizar el mejor histórico.
      updateExercise(exercise.clientId, (ex) => ({
        ...ex,
        bestHistoricalScore: pr ? score.value : ex.bestHistoricalScore,
        sets: ex.sets.map((s) =>
          s.clientId === set.clientId
            ? { ...s, estimated1Rm: score.estimated1Rm, isPr: pr }
            : s,
        ),
      }));

      // 4) Celebración (solo en series efectivas / al fallo).
      const effective = set.setType === "WORKING" || set.setType === "FAILURE";
      if (effective && rankedUp) {
        setCelebration({
          id: newId(),
          kind: "RANK_UP",
          title: `¡${rankLabel(newRank.rank)} ${newRank.subTier}!`,
          subtitle: `${exercise.name} sube de rango`,
          color: rankColor(newRank.rank),
        });
      } else if (effective && pr) {
        setCelebration({
          id: newId(),
          kind: "PR",
          title: "¡Nuevo PR!",
          subtitle: `${exercise.name} · ${
            score.estimated1Rm ? `${score.estimated1Rm} kg 1RM` : `${score.value}`
          }`,
          color: "#00E5FF",
        });
      }

      // 5) Disparar el temporizador de descanso en series efectivas.
      if (effective) {
        setRestSeconds(exercise.restSeconds);
        setRestNonce((n) => n + 1);
      }
    },
    [initialSession.bodyWeightKg, updateExercise, newId],
  );

  const handleFinish = useCallback(async () => {
    setFinishing(true);
    try {
      const local = await finishSession();
      onFinished?.({ totalVolumeKg: local.totalVolumeKg, sets: local.sets.length });
    } finally {
      setFinishing(false);
    }
  }, [finishSession, onFinished]);

  const completedSets = session.exercises.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
    0,
  );

  return (
    <div className="mx-auto max-w-md px-4 pb-40 pt-4">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">{session.name}</h1>
          <p className="font-mono text-xs tabular-nums text-[#A1A1AA]">
            {completedSets} series completadas
          </p>
        </div>
        <SyncBadge online={sync.online} pending={sync.pending} />
      </header>

      {/* Selector de paso de peso */}
      <div className="mb-4 flex items-center gap-2">
        <span className="text-xs text-[#A1A1AA]">Paso de peso:</span>
        {WEIGHT_STEPS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setWeightStep(s)}
            className={`rounded-lg px-3 py-1 font-mono text-xs tabular-nums active:scale-95 ${
              weightStep === s
                ? "bg-[#3B82F6] text-white"
                : "bg-zinc-800 text-[#A1A1AA]"
            }`}
          >
            {s} kg
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {session.exercises.map((ex) => (
          <ExerciseCard
            key={ex.clientId}
            exercise={ex}
            weightStep={weightStep}
            onUpdate={(updater) => updateExercise(ex.clientId, updater)}
            onSetCompleted={handleSetCompleted}
            newId={newId}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={handleFinish}
        disabled={finishing || completedSets === 0}
        className="mt-6 w-full rounded-2xl bg-[#10B981] py-3.5 text-base font-bold text-[#052e22] active:scale-[0.98] disabled:opacity-40"
      >
        {finishing ? "Guardando…" : "Finalizar entrenamiento"}
      </button>

      <RestTimer
        key={restNonce}
        seconds={restSeconds}
        onDismiss={() => setRestSeconds(null)}
      />
      <CelebrationToast
        celebration={celebration}
        onDone={() => setCelebration(null)}
      />
    </div>
  );
}

export default ActiveWorkout;
