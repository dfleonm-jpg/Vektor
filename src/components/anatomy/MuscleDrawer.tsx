"use client";

/**
 * Vektor — Bottom-sheet de detalle de un músculo.
 *
 * Se abre al tocar una zona del mapa anatómico. Muestra rango + sub-nivel,
 * barra de progreso exacta, mejor PR, volumen semanal frente al rango óptimo
 * de hipertrofia y un badge de alerta si el músculo está rezagado respecto al
 * rango global del atleta.
 *
 * Usable con una sola mano: el sheet sube desde abajo, se cierra con swipe o
 * tocando el backdrop.
 */

import { AnimatePresence, motion } from "framer-motion";
import {
  classifyWeeklyVolume,
  isLaggingMuscle,
  OPTIMAL_WEEKLY_SETS,
  type MuscleRankState,
} from "../../lib/ranking-engine";
import {
  MUSCLE_LABELS,
  RANK_META,
  SUB_TIERS,
  type MuscleGroup,
} from "../../lib/rank-config";

export interface MuscleDrawerProps {
  group: MuscleGroup | null;
  state: MuscleRankState | null;
  /** Puntuación global del atleta, para calcular rezago. */
  globalScore: number;
  onClose: () => void;
}

export function MuscleDrawer({
  group,
  state,
  globalScore,
  onClose,
}: MuscleDrawerProps) {
  const open = group !== null && state !== null;

  return (
    <AnimatePresence>
      {open && group && state && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl border-t border-zinc-800 bg-[#121215] p-5 pb-8"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120) onClose();
            }}
            role="dialog"
            aria-label={`Detalle de ${MUSCLE_LABELS[group]}`}
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-zinc-700" />
            <DrawerBody group={group} state={state} globalScore={globalScore} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function DrawerBody({
  group,
  state,
  globalScore,
}: {
  group: MuscleGroup;
  state: MuscleRankState;
  globalScore: number;
}) {
  const meta = RANK_META[state.rank];
  const lagging = isLaggingMuscle(state.normalizedScore, globalScore);
  const volumeStatus = classifyWeeklyVolume(state.weeklySets);
  const tierIndex = SUB_TIERS.indexOf(state.subTier);

  return (
    <div className="space-y-5">
      {/* Cabecera: nombre + rango */}
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#FAFAFA]">
            {MUSCLE_LABELS[group]}
          </h2>
          {!state.hasData && (
            <p className="mt-0.5 text-xs text-[#A1A1AA]">
              Sin registros todavía — rango base
            </p>
          )}
        </div>
        <span
          className="shrink-0 rounded-full px-3 py-1 text-xs font-bold"
          style={{
            color: meta.color,
            backgroundColor: `${meta.color}1a`,
            border: `1px solid ${meta.color}66`,
          }}
        >
          {meta.label} {state.subTier}
        </span>
      </header>

      {lagging && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2">
          <span className="text-sm" aria-hidden>
            ⚠️
          </span>
          <p className="text-xs text-amber-300">
            Músculo rezagado respecto a tu rango global. Prioriza su volumen.
          </p>
        </div>
      )}

      {/* Barra de progreso al siguiente escalón */}
      <section>
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="text-[#A1A1AA]">Progreso al siguiente escalón</span>
          <span className="font-mono tabular-nums text-[#FAFAFA]">
            {state.progressPct.toFixed(1)}%
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-800">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: meta.color }}
            initial={{ width: 0 }}
            animate={{ width: `${state.progressPct}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        <div className="mt-1.5 flex gap-1" aria-hidden>
          {SUB_TIERS.map((t, i) => (
            <span
              key={t}
              className="h-1 flex-1 rounded-full"
              style={{
                backgroundColor: i <= tierIndex ? meta.color : "#27272A",
              }}
            />
          ))}
        </div>
      </section>

      {/* Métricas */}
      <section className="grid grid-cols-2 gap-3">
        <Stat
          label="Mejor PR"
          value={state.bestPrLabel ?? "—"}
          mono
        />
        <Stat
          label="Series / semana"
          value={
            <span>
              <span className="font-mono tabular-nums">{state.weeklySets}</span>
              <span className="text-[#A1A1AA]">
                {" "}
                / {OPTIMAL_WEEKLY_SETS.min}–{OPTIMAL_WEEKLY_SETS.max}
              </span>
            </span>
          }
          hint={<VolumeHint status={volumeStatus} />}
        />
      </section>

      {/* Ejercicios asignados */}
      <section>
        <h3 className="mb-2 text-xs font-medium text-[#A1A1AA]">
          Ejercicios principales
        </h3>
        {state.exercises.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {state.exercises.map((ex) => (
              <li
                key={ex}
                className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-2.5 py-1 text-xs text-[#FAFAFA]"
              >
                {ex}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-[#A1A1AA]">
            Aún no has asignado ejercicios a este músculo.
          </p>
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
      <p className="text-[11px] uppercase tracking-wide text-[#A1A1AA]">
        {label}
      </p>
      <p
        className={`mt-1 text-sm text-[#FAFAFA] ${mono ? "font-mono tabular-nums" : ""}`}
      >
        {value}
      </p>
      {hint}
    </div>
  );
}

function VolumeHint({ status }: { status: ReturnType<typeof classifyWeeklyVolume> }) {
  const map = {
    UNDER: { text: "Por debajo del óptimo", color: "#A1A1AA" },
    OPTIMAL: { text: "Zona óptima", color: "#10B981" },
    OVER: { text: "Sobre el óptimo", color: "#EAB308" },
  } as const;
  const { text, color } = map[status];
  return (
    <p className="mt-1 text-[11px]" style={{ color }}>
      {text}
    </p>
  );
}

export default MuscleDrawer;
