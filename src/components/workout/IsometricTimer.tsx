"use client";

/**
 * Vektor — Cronómetro de ejecución para ejercicios isométricos.
 *
 * Para Core / L-sit / plancha, el input de repeticiones se sustituye por este
 * cronómetro: se inicia/para con un botón grande (usable con el pulgar) y al
 * parar fija los segundos sostenidos como valor de la serie.
 */

import { useEffect, useRef, useState } from "react";

export interface IsometricTimerProps {
  /** Segundos actuales de la serie. */
  value: number;
  onChange: (seconds: number) => void;
}

export function IsometricTimer({ value, onChange }: IsometricTimerProps) {
  const [running, setRunning] = useState(false);
  const startRef = useRef<number>(0);
  const baseRef = useRef<number>(0);

  useEffect(() => {
    if (!running) return;
    startRef.current = Date.now();
    baseRef.current = value;
    const id = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startRef.current) / 1000);
      onChange(baseRef.current + elapsed);
    }, 250);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  return (
    <div className="flex items-center gap-4">
      <div className="flex-1 text-center">
        <p className="text-[11px] uppercase tracking-wide text-[#A1A1AA]">
          Segundos
        </p>
        <p className="font-mono text-4xl font-bold tabular-nums text-[#FAFAFA]">
          {value}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setRunning((r) => !r)}
          className={`rounded-xl px-5 py-3 text-sm font-semibold active:scale-95 ${
            running
              ? "bg-[#F43F5E] text-white"
              : "bg-[#3B82F6] text-white"
          }`}
        >
          {running ? "Parar" : "Iniciar"}
        </button>
        <button
          type="button"
          onClick={() => {
            setRunning(false);
            onChange(0);
          }}
          className="rounded-xl border border-zinc-800 px-5 py-2 text-xs text-[#A1A1AA] active:scale-95"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

export default IsometricTimer;
