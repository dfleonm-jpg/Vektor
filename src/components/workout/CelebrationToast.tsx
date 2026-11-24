"use client";

/**
 * Vektor — Micro-celebración no intrusiva de PR / subida de rango.
 *
 * Aparece arriba, se desvanece sola y no bloquea la pantalla ni el flujo del
 * entreno. Se usa tanto para récords de 1RM como para ascensos de rango.
 */

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

export interface Celebration {
  id: string;
  kind: "PR" | "RANK_UP";
  title: string;
  subtitle: string;
  /** Color de acento (p. ej. el color del rango alcanzado). */
  color: string;
}

export interface CelebrationToastProps {
  celebration: Celebration | null;
  onDone: () => void;
  durationMs?: number;
}

export function CelebrationToast({
  celebration,
  onDone,
  durationMs = 2600,
}: CelebrationToastProps) {
  useEffect(() => {
    if (!celebration) return;
    const id = setTimeout(onDone, durationMs);
    return () => clearTimeout(id);
  }, [celebration, onDone, durationMs]);

  return (
    <AnimatePresence>
      {celebration && (
        <motion.div
          className="pointer-events-none fixed inset-x-0 top-3 z-50 flex justify-center px-4"
          initial={{ y: -40, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -40, opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
        >
          <div
            className="flex items-center gap-3 rounded-2xl border bg-[#121215]/95 px-4 py-2.5 shadow-lg backdrop-blur"
            style={{ borderColor: `${celebration.color}66` }}
          >
            <motion.span
              className="text-xl"
              aria-hidden
              animate={{ rotate: [0, -12, 12, 0], scale: [1, 1.25, 1] }}
              transition={{ duration: 0.6 }}
            >
              {celebration.kind === "PR" ? "⚡" : "▲"}
            </motion.span>
            <div>
              <p
                className="text-sm font-bold"
                style={{ color: celebration.color }}
              >
                {celebration.title}
              </p>
              <p className="text-xs text-[#A1A1AA]">{celebration.subtitle}</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default CelebrationToast;
