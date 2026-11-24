"use client";

/**
 * Vektor — Cabecera de rango global del atleta.
 *
 * Badge del rango + sub-nivel, barra de progreso al siguiente escalón, y alerta
 * sutil cuando la asimetría entre músculos está penalizando el rango global
 * (coherente con la filosofía del rango tope "Simétrico").
 */

import { motion } from "framer-motion";
import { RANK_META, type CompetitiveRank, type SubTier } from "../../lib/rank-config";
import { VektorLogo } from "../VektorLogo";

export interface GlobalRankHeaderProps {
  rank: CompetitiveRank;
  subTier: SubTier;
  progressPct: number;
  /** true si la asimetría está penalizando el rango global. */
  asymmetryPenalty?: boolean;
}

export function GlobalRankHeader({
  rank,
  subTier,
  progressPct,
  asymmetryPenalty = false,
}: GlobalRankHeaderProps) {
  const meta = RANK_META[rank];
  const gradient = meta.gradientTo
    ? `linear-gradient(90deg, ${meta.color}, ${meta.gradientTo})`
    : meta.color;

  return (
    <section className="rounded-2xl border border-zinc-800 bg-[#121215] p-4">
      <div className="flex items-center gap-3">
        <VektorLogo size={40} />
        <div className="flex-1">
          <p className="text-xs uppercase tracking-wide text-[#A1A1AA]">
            Rango Global Vektor
          </p>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold" style={{ color: meta.color }}>
              {meta.label}
            </h1>
            <span
              className="rounded-md px-1.5 py-0.5 font-mono text-xs font-bold"
              style={{ backgroundColor: `${meta.color}22`, color: meta.color }}
            >
              {subTier}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-[#A1A1AA]">Progreso al siguiente escalón</span>
          <span className="font-mono tabular-nums text-[#FAFAFA]">
            {progressPct.toFixed(1)}%
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-800">
          <motion.div
            className="h-full rounded-full"
            style={{ background: gradient }}
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
      </div>

      {asymmetryPenalty && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2">
          <span className="text-sm" aria-hidden>
            ⚖️
          </span>
          <p className="text-xs text-amber-300">
            Asimetría muscular penalizando tu rango. Equilibra los músculos
            rezagados para subir más rápido.
          </p>
        </div>
      )}
    </section>
  );
}

export default GlobalRankHeader;
