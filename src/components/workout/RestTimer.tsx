"use client";

/**
 * Vektor — Temporizador de descanso flotante.
 *
 * Barra persistente sobre el tracker. Se activa al completar una serie efectiva.
 * Presets (60/90/120/180 s), ajuste ±15 s, saltar, y vibración háptica
 * (navigator.vibrate) + beep sutil opcional al llegar a 00:00.
 */

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export interface RestTimerProps {
  /** Segundos iniciales cuando se dispara; null = oculto. */
  seconds: number | null;
  /** Reproduce un beep sutil al terminar. */
  sound?: boolean;
  onDismiss: () => void;
}

const PRESETS = [60, 90, 120, 180];

function beep() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.value = 0.05;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  } catch {
    // Audio no disponible: se ignora silenciosamente.
  }
}

function fmt(total: number): string {
  const m = Math.floor(Math.max(0, total) / 60);
  const s = Math.max(0, total) % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function RestTimer({ seconds, sound = false, onDismiss }: RestTimerProps) {
  const [remaining, setRemaining] = useState(0);
  const firedRef = useRef(false);

  // Reinicia la cuenta cuando se dispara con un nuevo valor.
  useEffect(() => {
    if (seconds === null) return;
    setRemaining(seconds);
    firedRef.current = false;
  }, [seconds]);

  useEffect(() => {
    if (seconds === null) return;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id);
          if (!firedRef.current) {
            firedRef.current = true;
            if (typeof navigator !== "undefined" && "vibrate" in navigator) {
              navigator.vibrate([200, 100, 200]);
            }
            if (sound) beep();
          }
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [seconds, sound]);

  const done = remaining === 0;
  const total = seconds ?? 1;
  const pct = seconds ? (remaining / total) * 100 : 0;

  return (
    <AnimatePresence>
      {seconds !== null && (
        <motion.div
          className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-800 bg-[#121215]/95 backdrop-blur"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
        >
          {/* Barra de progreso del descanso */}
          <div className="h-1 w-full bg-zinc-800">
            <motion.div
              className="h-full"
              style={{ backgroundColor: done ? "#10B981" : "#3B82F6" }}
              animate={{ width: `${pct}%` }}
              transition={{ ease: "linear", duration: 0.9 }}
            />
          </div>

          <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3">
            <div className="min-w-[88px]">
              <p className="text-[11px] uppercase tracking-wide text-[#A1A1AA]">
                Descanso
              </p>
              <p
                className="font-mono text-2xl font-bold tabular-nums"
                style={{ color: done ? "#10B981" : "#FAFAFA" }}
              >
                {fmt(remaining)}
              </p>
            </div>

            <div className="flex flex-1 items-center justify-end gap-2">
              <TimerBtn onClick={() => setRemaining((r) => Math.max(0, r - 15))}>
                −15s
              </TimerBtn>
              <TimerBtn onClick={() => setRemaining((r) => r + 15)}>+15s</TimerBtn>
              <button
                type="button"
                onClick={onDismiss}
                className="rounded-lg bg-[#3B82F6] px-4 py-2 text-sm font-semibold text-white active:scale-95"
              >
                {done ? "Listo" : "Saltar"}
              </button>
            </div>
          </div>

          {/* Presets rápidos */}
          <div className="mx-auto flex max-w-md gap-2 px-4 pb-3">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setRemaining(p)}
                className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900/60 py-1.5 text-xs font-medium text-[#A1A1AA] active:scale-95"
              >
                {p}s
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function TimerBtn({
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
      className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 font-mono text-sm tabular-nums text-[#FAFAFA] active:scale-95"
    >
      {children}
    </button>
  );
}

export default RestTimer;
