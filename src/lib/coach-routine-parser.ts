/**
 * Vektor — Parser y validador de rutinas generadas por el Coach IA.
 *
 * Extrae un bloque JSON de la respuesta del modelo (que puede venir rodeado de
 * texto o en una valla ```json), lo valida con Zod y comprueba que cada
 * exerciseSlug existe en el catálogo real de ejercicios. Así nunca se persiste
 * una rutina que referencie un ejercicio inexistente.
 */

import { coachRoutineOutputSchema, type CoachRoutineOutput } from "./schemas";

export type ParseResult =
  | { ok: true; data: CoachRoutineOutput }
  | { ok: false; error: string; unknownSlugs?: string[] };

/** Intenta extraer el primer objeto JSON de un texto arbitrario. */
export function extractJsonBlock(text: string): string | null {
  // 1) Valla de código ```json ... ```
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence && fence[1]) return fence[1].trim();

  // 2) Primer objeto balanceado { ... }.
  const start = text.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

/**
 * Parsea y valida la salida del Coach como rutina. `validSlugs` es el conjunto
 * de slugs del catálogo; si alguno no existe, falla con la lista.
 */
export function parseCoachRoutine(
  text: string,
  validSlugs: Set<string>,
): ParseResult {
  const block = extractJsonBlock(text);
  if (!block) return { ok: false, error: "No se encontró un bloque JSON en la respuesta." };

  let json: unknown;
  try {
    json = JSON.parse(block);
  } catch {
    return { ok: false, error: "El bloque JSON no es válido." };
  }

  const parsed = coachRoutineOutputSchema.safeParse(json);
  if (!parsed.success) {
    return {
      ok: false,
      error: "La rutina no cumple el esquema esperado.",
    };
  }

  // Verifica que todos los slugs existan en el catálogo.
  const slugs = parsed.data.routine.days.flatMap((d) =>
    d.exercises.map((e) => e.exerciseSlug),
  );
  const unknown = [...new Set(slugs.filter((s) => !validSlugs.has(s)))];
  if (unknown.length > 0) {
    return {
      ok: false,
      error: "La rutina referencia ejercicios que no están en el catálogo.",
      unknownSlugs: unknown,
    };
  }

  return { ok: true, data: parsed.data };
}
