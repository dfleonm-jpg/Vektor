"use client";

/**
 * Vektor — Mapa anatómico SVG interactivo.
 *
 * Silueta frontal/posterior con 14 zonas musculares táctiles. Cada zona se
 * rellena con el color hex de su rango actual y pulsa sutilmente cuando el
 * músculo está a punto de subir de escalón (progressPct ≥ 85).
 *
 * Contrato de datos: recibe `Record<MuscleGroup, MuscleRankState>` tipado
 * directamente desde el motor de ranking, de modo que el Paso 3 solo tiene que
 * producir esos estados a partir de los sets reales y pasarlos aquí.
 */

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  isNearRankUp,
  neutralMuscleState,
  type MuscleRankState,
} from "../../lib/ranking-engine";
import { RANK_META, type MuscleGroup } from "../../lib/rank-config";
import {
  ANATOMY_VIEWBOX,
  BODY_OUTLINE,
  musclesForView,
  type AnatomyView,
} from "./muscle-paths";
import { MuscleDrawer } from "./MuscleDrawer";

export interface AnatomyMapProps {
  /** Estado por músculo. Los ausentes se renderizan en estado base/neutro. */
  states: Partial<Record<MuscleGroup, MuscleRankState>>;
  /** Puntuación global del atleta (0-100) para detectar músculos rezagados. */
  globalScore?: number;
  /** Vista inicial. */
  initialView?: AnatomyView;
}

export function AnatomyMap({
  states,
  globalScore = 0,
  initialView = "front",
}: AnatomyMapProps) {
  const [view, setView] = useState<AnatomyView>(initialView);
  const [selected, setSelected] = useState<MuscleGroup | null>(null);

  const shapes = useMemo(() => musclesForView(view), [view]);

  const stateFor = (group: MuscleGroup): MuscleRankState =>
    states[group] ?? neutralMuscleState();

  return (
    <div className="w-full">
      {/* Toggle Frontal / Posterior */}
      <div className="mb-3 flex justify-center">
        <div className="inline-flex rounded-full border border-zinc-800 bg-[#121215] p-1">
          <ToggleButton
            active={view === "front"}
            onClick={() => setView("front")}
          >
            Frontal
          </ToggleButton>
          <ToggleButton
            active={view === "back"}
            onClick={() => setView("back")}
          >
            Posterior
          </ToggleButton>
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-xs">
        <svg
          viewBox={ANATOMY_VIEWBOX}
          className="h-auto w-full select-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Contorno del cuerpo */}
          <path
            d={BODY_OUTLINE[view]}
            fill="#161619"
            stroke="#27272A"
            strokeWidth="1.5"
          />

          {/* Zonas musculares */}
          {shapes.map((shape) => {
            const st = stateFor(shape.group);
            const color = st.hasData ? RANK_META[st.rank].color : "#3F3F46";
            const near = st.hasData && isNearRankUp(st.progressPct);
            const isSelected = selected === shape.group;

            return (
              <g
                key={`${view}-${shape.group}`}
                role="button"
                tabIndex={0}
                aria-label={`Seleccionar ${shape.group}`}
                className="cursor-pointer outline-none"
                onClick={() => setSelected(shape.group)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelected(shape.group);
                  }
                }}
              >
                {shape.paths.map((d, i) => (
                  <motion.path
                    key={i}
                    d={d}
                    fill={color}
                    stroke={isSelected ? "#FAFAFA" : "#09090B"}
                    strokeWidth={isSelected ? 2 : 1}
                    fillOpacity={st.hasData ? 0.92 : 0.5}
                    initial={false}
                    animate={
                      near
                        ? { fillOpacity: [0.7, 1, 0.7] }
                        : { fillOpacity: st.hasData ? 0.92 : 0.5 }
                    }
                    transition={
                      near
                        ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" }
                        : { duration: 0.3 }
                    }
                    style={
                      near
                        ? { filter: `drop-shadow(0 0 4px ${color})` }
                        : undefined
                    }
                  />
                ))}
              </g>
            );
          })}
        </svg>
      </div>

      <MuscleDrawer
        group={selected}
        state={selected ? stateFor(selected) : null}
        globalScore={globalScore}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}

function ToggleButton({
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
      className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-[#3B82F6] text-white"
          : "text-[#A1A1AA] hover:text-[#FAFAFA]"
      }`}
    >
      {children}
    </button>
  );
}

export default AnatomyMap;
