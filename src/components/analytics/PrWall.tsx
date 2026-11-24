"use client";

/**
 * Vektor — Muro de Récords Personales (PR Wall).
 *
 * Lista filtrable por grupo muscular con la mejor marca histórica, fecha y
 * rango alcanzado en cada ejercicio.
 */

import { useMemo, useState } from "react";
import { MUSCLE_LABELS, RANK_META, type CompetitiveRank, type MuscleGroup } from "../../lib/rank-config";

export interface PrEntry {
  exerciseName: string;
  muscle: MuscleGroup;
  bestLabel: string; // p. ej. "110 kg × 3" o "L-sit 32 s"
  date: string;
  rank: CompetitiveRank;
}

export interface PrWallProps {
  entries: PrEntry[];
}

export function PrWall({ entries }: PrWallProps) {
  const [filter, setFilter] = useState<MuscleGroup | "ALL">("ALL");

  const muscles = useMemo(
    () => Array.from(new Set(entries.map((e) => e.muscle))),
    [entries],
  );

  const visible = useMemo(
    () => (filter === "ALL" ? entries : entries.filter((e) => e.muscle === filter)),
    [entries, filter],
  );

  return (
    <section className="rounded-2xl border border-zinc-800 bg-[#121215] p-4">
      <h2 className="mb-3 text-sm font-semibold text-[#FAFAFA]">
        Muro de Récords Personales
      </h2>

      <div className="mb-3 flex flex-wrap gap-1.5">
        <FilterChip active={filter === "ALL"} onClick={() => setFilter("ALL")}>
          Todos
        </FilterChip>
        {muscles.map((m) => (
          <FilterChip key={m} active={filter === m} onClick={() => setFilter(m)}>
            {MUSCLE_LABELS[m]}
          </FilterChip>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="text-xs text-[#A1A1AA]">
          Aún no hay récords. Completa series efectivas para empezar a registrar PRs.
        </p>
      ) : (
        <ul className="space-y-2">
          {visible.map((e, i) => {
            const meta = RANK_META[e.rank];
            return (
              <li
                key={i}
                className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-[#FAFAFA]">{e.exerciseName}</p>
                  <p className="font-mono text-xs tabular-nums text-[#A1A1AA]">
                    {e.bestLabel} · {e.date}
                  </p>
                </div>
                <span
                  className="ml-2 shrink-0 rounded-md px-2 py-0.5 text-xs font-bold"
                  style={{ color: meta.color, backgroundColor: `${meta.color}1a` }}
                >
                  {meta.label}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-2.5 py-1 text-xs active:scale-95 ${
        active ? "bg-[#3B82F6] text-white" : "bg-zinc-800 text-[#A1A1AA]"
      }`}
    >
      {children}
    </button>
  );
}

export default PrWall;
