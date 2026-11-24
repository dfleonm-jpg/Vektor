/**
 * Vektor — Gestor de sincronización offline-first.
 *
 * Procesa la cola de operaciones de IndexedDB contra el backend cuando hay
 * conexión. El tracker del Paso 3 encola operaciones; este módulo las drena.
 *
 * El endpoint real (`/api/sync`) se implementa en el Paso 3/4; aquí queda la
 * mecánica de reintentos, orden FIFO y disparo automático al recuperar red.
 */

import {
  dequeueOperation,
  enqueueOperation,
  getQueue,
  setSessionStatus,
  type LocalWorkoutSession,
  type SyncOperation,
} from "./db";

const MAX_ATTEMPTS = 5;

/** Endpoint al que se envían las operaciones. Configurable para tests. */
let syncEndpoint = "/api/sync";

export function configureSyncEndpoint(url: string): void {
  syncEndpoint = url;
}

/** Encola una sesión completa para subirla al servidor. */
export async function queueSessionUpload(
  session: LocalWorkoutSession,
): Promise<void> {
  await enqueueOperation({
    type: "UPSERT_SESSION",
    clientId: session.clientId,
    payload: session,
    attempts: 0,
    createdAt: Date.now(),
  });
  await setSessionStatus(session.clientId, "pending");
}

let draining = false;

/**
 * Procesa la cola en orden. Seguro para llamar varias veces: usa un cerrojo
 * simple para evitar ejecuciones concurrentes. Devuelve cuántas operaciones
 * se sincronizaron con éxito.
 */
export async function drainQueue(): Promise<number> {
  if (draining) return 0;
  if (typeof navigator !== "undefined" && !navigator.onLine) return 0;

  draining = true;
  let synced = 0;

  try {
    const queue = await getQueue();
    for (const op of queue) {
      const ok = await sendOperation(op);
      if (ok) {
        if (op.id !== undefined) await dequeueOperation(op.id);
        if (op.type === "UPSERT_SESSION") {
          await setSessionStatus(op.clientId, "synced");
        }
        synced++;
      } else {
        // Reintento acotado: si se agotan los intentos, se marca error y se deja
        // fuera del flujo automático para no bloquear la cola.
        if (op.attempts + 1 >= MAX_ATTEMPTS) {
          if (op.id !== undefined) await dequeueOperation(op.id);
          await setSessionStatus(op.clientId, "error");
        }
        break; // preserva el orden FIFO; reintenta en la próxima pasada
      }
    }
  } finally {
    draining = false;
  }

  return synced;
}

/** Envía una operación al backend. Devuelve true si el servidor la aceptó. */
async function sendOperation(op: SyncOperation): Promise<boolean> {
  try {
    const res = await fetch(syncEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: op.type, payload: op.payload }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Registra los listeners que disparan la sincronización automáticamente al
 * recuperar la conexión. Se llama una vez desde el arranque del cliente.
 */
export function initAutoSync(): void {
  if (typeof window === "undefined") return;
  window.addEventListener("online", () => {
    void drainQueue();
  });
  // Intento inicial por si quedaron operaciones de una sesión previa.
  if (navigator.onLine) void drainQueue();
}
