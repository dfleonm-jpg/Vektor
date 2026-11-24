"use client";

/**
 * Vektor — Panel de chat del Coach IA.
 *
 * Bottom-sheet con historial de mensajes. Consultas rápidas usan streaming;
 * cuando el Coach devuelve una rutina estructurada, se muestra como tarjeta
 * previsualizable con botón de guardar.
 */

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { RoutineInput } from "../../lib/schemas";
import { RoutinePreviewCard } from "./RoutinePreviewCard";

type ChatMessage =
  | { role: "user"; content: string }
  | { role: "assistant"; content: string }
  | { role: "assistant"; routine: RoutineInput; rationale?: string };

export interface CoachDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Contexto serializado del atleta (de buildCoachContext). */
  context: unknown;
  onSaveRoutine: (routine: RoutineInput) => Promise<void>;
}

export function CoachDrawer({
  open,
  onClose,
  context,
  onSaveRoutine,
}: CoachDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const streamRef = useRef<string>("");

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const history = [...messages, { role: "user" as const, content: text }];
    setMessages(history);
    setLoading(true);

    // Heurística: si pide crear/ajustar rutina, pedimos salida estructurada (no stream).
    const wantsRoutine = /rutina|mesociclo|ppl|torso|pierna|full body|split|programa/i.test(
      text,
    );

    try {
      const apiMessages = history.map((m) =>
        "content" in m
          ? { role: m.role, content: m.content }
          : { role: m.role, content: "[rutina generada]" },
      );

      if (wantsRoutine) {
        const res = await fetch("/api/coach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: apiMessages, context, stream: false }),
        });
        const data = await res.json();
        if (data.ok && data.type === "routine") {
          setMessages((m) => [
            ...m,
            { role: "assistant", routine: data.routine, rationale: data.rationale },
          ]);
        } else {
          setMessages((m) => [
            ...m,
            { role: "assistant", content: data.content ?? data.error ?? "Sin respuesta." },
          ]);
        }
      } else {
        // Streaming para consultas rápidas.
        streamRef.current = "";
        setMessages((m) => [...m, { role: "assistant", content: "" }]);
        const res = await fetch("/api/coach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: apiMessages, context, stream: true }),
        });
        if (!res.body) throw new Error("Sin cuerpo de respuesta");
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split("\n")) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const json = trimmed.slice(5).trim();
            if (json === "[DONE]") continue;
            try {
              const delta = JSON.parse(json).choices?.[0]?.delta?.content;
              if (delta) {
                streamRef.current += delta;
                setMessages((m) => {
                  const copy = [...m];
                  copy[copy.length - 1] = {
                    role: "assistant",
                    content: streamRef.current,
                  };
                  return copy;
                });
              }
            } catch {
              // fragmento parcial; se ignora
            }
          }
        }
      }
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "No pude contactar al Coach. Revisa tu conexión." },
      ]);
    } finally {
      setLoading(false);
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
            className="fixed inset-x-0 bottom-0 z-50 flex h-[85dvh] flex-col rounded-t-3xl border-t border-zinc-800 bg-[#121215]"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            role="dialog"
            aria-label="Vektor Coach"
          >
            <div className="mx-auto my-3 h-1.5 w-12 rounded-full bg-zinc-700" />
            <header className="px-5 pb-2">
              <h2 className="text-base font-bold">Vektor Coach</h2>
              <p className="text-xs text-[#A1A1AA]">
                Pregunta rápido o pide una rutina (PPL, Torso/Pierna, Híbrido…)
              </p>
            </header>

            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-3">
              {messages.length === 0 && (
                <p className="text-sm text-[#A1A1AA]">
                  Ejemplo: «La polea de espalda está ocupada, dame una alternativa
                  con el mismo estímulo» o «Créame una rutina PPL de 6 días».
                </p>
              )}
              {messages.map((m, i) =>
                "routine" in m ? (
                  <RoutinePreviewCard
                    key={i}
                    routine={m.routine}
                    rationale={m.rationale}
                    onSave={onSaveRoutine}
                  />
                ) : (
                  <div
                    key={i}
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${
                      m.role === "user"
                        ? "ml-auto bg-[#3B82F6] text-white"
                        : "bg-zinc-800 text-[#FAFAFA]"
                    }`}
                  >
                    {m.content || "…"}
                  </div>
                ),
              )}
            </div>

            <div className="flex items-center gap-2 border-t border-zinc-800 p-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void send();
                }}
                placeholder="Escribe al Coach…"
                className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-sm text-[#FAFAFA] outline-none placeholder:text-[#71717A] focus:border-[#3B82F6]"
              />
              <button
                type="button"
                onClick={() => void send()}
                disabled={loading}
                className="rounded-xl bg-[#3B82F6] px-4 py-2.5 text-sm font-semibold text-white active:scale-95 disabled:opacity-50"
              >
                {loading ? "…" : "Enviar"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default CoachDrawer;
