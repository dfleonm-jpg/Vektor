"use client";

/**
 * Vektor — Actualización rápida de peso corporal.
 *
 * Bottom-sheet con stepper de ±0.1 / ±0.5 kg. Al guardar, crea un BodyMetricLog
 * (vía callback) para que la fuerza relativa se recalcule al instante.
 */

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export interface BodyWeightSheetProps {
  open: boolean;
  currentKg: number;
  onClose: () => void;
  onSave: (weightKg: number) => void | Promise<void>;
}

export function BodyWeightSheet({
  open,
  currentKg,
  onClose,
  onSave,
}: BodyWeightSheetProps) {
  const [value, setValue] = useState(currentKg);
  const [saving, setSaving] = useState(false);

  const patch = (delta: number) =>
    setValue((v) => Math.max(0, Math.round((v + delta) * 10) / 10));

  const save = async () => {
    setSaving(true);
    try {
      await onSave(value);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
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
            role="dialog"
            aria-label="Actualizar peso corporal"
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-zinc-700" />
            <h2 className="mb-1 text-lg font-semibold">Peso corporal</h2>
            <p className="mb-5 text-xs text-[#A1A1AA]">
              Al guardar se recalcula tu fuerza relativa y tus rangos.
            </p>

            <div className="flex items-center justify-center gap-3">
              <StepBtn onClick={() => patch(-0.5)}>−0.5</StepBtn>
              <StepBtn onClick={() => patch(-0.1)}>−0.1</StepBtn>
              <span className="min-w-[120px] text-center font-mono text-4xl font-bold tabular-nums">
                {value.toFixed(1)}
                <span className="ml-1 text-base text-[#A1A1AA]">kg</span>
              </span>
              <StepBtn onClick={() => patch(0.1)}>+0.1</StepBtn>
              <StepBtn onClick={() => patch(0.5)}>+0.5</StepBtn>
            </div>

            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="mt-6 w-full rounded-2xl bg-[#3B82F6] py-3 text-base font-semibold text-white active:scale-[0.98] disabled:opacity-50"
            >
              {saving ? "Guardando…" : "Guardar peso"}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function StepBtn({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-10 rounded-lg bg-zinc-800 px-2.5 font-mono text-xs tabular-nums text-[#FAFAFA] active:scale-90"
    >
      {children}
    </button>
  );
}

export default BodyWeightSheet;
