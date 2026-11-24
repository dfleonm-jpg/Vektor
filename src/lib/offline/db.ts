/**
 * Vektor — Capa IndexedDB para la cola de sincronización offline-first.
 *
 * Objetivo: permitir registrar entrenamientos completos sin conexión (vital en
 * gimnasios con mala señal) y sincronizarlos con Supabase al recuperar red.
 *
 * Esta es la estructura base que el tracker del Paso 3 usará para encolar
 * sesiones y series. Usa la API nativa de IndexedDB (sin dependencias) con una
 * envoltura de promesas tipada.
 *
 * Almacenes:
 *   - "sessions": sesiones de entrenamiento pendientes de sincronizar.
 *   - "sync_queue": operaciones individuales (upsert/delete) en orden FIFO.
 */

export const DB_NAME = "vektor-offline";
export const DB_VERSION = 1;

export const STORE_SESSIONS = "sessions";
export const STORE_QUEUE = "sync_queue";

/** Estado de sincronización de una entidad local. */
export type SyncStatus = "pending" | "syncing" | "synced" | "error";

/** Sesión de entrenamiento almacenada localmente. */
export interface LocalWorkoutSession {
  /** UUID generado en cliente; se usa como clientId al sincronizar. */
  clientId: string;
  userId: string;
  routineDayId: string | null;
  name: string;
  startedAt: string; // ISO
  finishedAt: string | null; // ISO
  durationSec: number | null;
  totalVolumeKg: number;
  fatigueRpe: number | null;
  notes: string | null;
  sets: LocalWorkoutSet[];
  status: SyncStatus;
  updatedAt: number; // epoch ms
}

/** Serie almacenada localmente dentro de una sesión. */
export interface LocalWorkoutSet {
  clientId: string;
  exerciseId: string;
  setOrder: number;
  setType: "WARMUP" | "WORKING" | "DROPSET" | "FAILURE";
  weightKg: number;
  reps: number;
  rir: number | null;
  durationSec: number | null;
  estimated1Rm: number | null;
  isPr: boolean;
  rankAchieved: string | null;
}

/** Operación encolada para sincronizar con el servidor. */
export interface SyncOperation {
  /** Autoincremental. */
  id?: number;
  type: "UPSERT_SESSION" | "DELETE_SESSION" | "LOG_BODY_WEIGHT" | "SAVE_ROUTINE";
  clientId: string;
  payload: unknown;
  attempts: number;
  createdAt: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

/** Abre (o crea) la base de datos, creando los object stores en el upgrade. */
export function openDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB no disponible en este entorno."));
  }
  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_SESSIONS)) {
        const store = db.createObjectStore(STORE_SESSIONS, {
          keyPath: "clientId",
        });
        store.createIndex("status", "status", { unique: false });
        store.createIndex("userId", "userId", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_QUEUE)) {
        db.createObjectStore(STORE_QUEUE, {
          keyPath: "id",
          autoIncrement: true,
        });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Error abriendo IndexedDB"));
  });

  return dbPromise;
}

/** Envuelve un IDBRequest en una promesa. */
function promisify<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IDBRequest falló"));
  });
}

// ─────────────────────────── Sesiones ───────────────────────────

/** Guarda (crea o actualiza) una sesión local. */
export async function saveSession(session: LocalWorkoutSession): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE_SESSIONS, "readwrite");
  tx.objectStore(STORE_SESSIONS).put(session);
  await txDone(tx);
}

/** Recupera una sesión local por su clientId. */
export async function getSession(
  clientId: string,
): Promise<LocalWorkoutSession | undefined> {
  const db = await openDb();
  const tx = db.transaction(STORE_SESSIONS, "readonly");
  return promisify(
    tx.objectStore(STORE_SESSIONS).get(clientId) as IDBRequest<
      LocalWorkoutSession | undefined
    >,
  );
}

/** Lista todas las sesiones con un estado de sincronización dado. */
export async function getSessionsByStatus(
  status: SyncStatus,
): Promise<LocalWorkoutSession[]> {
  const db = await openDb();
  const tx = db.transaction(STORE_SESSIONS, "readonly");
  const index = tx.objectStore(STORE_SESSIONS).index("status");
  return promisify(index.getAll(status) as IDBRequest<LocalWorkoutSession[]>);
}

/** Marca el estado de sincronización de una sesión. */
export async function setSessionStatus(
  clientId: string,
  status: SyncStatus,
): Promise<void> {
  const session = await getSession(clientId);
  if (!session) return;
  session.status = status;
  session.updatedAt = Date.now();
  await saveSession(session);
}

/** Elimina una sesión local (tras sincronizar con éxito, por ejemplo). */
export async function deleteSession(clientId: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE_SESSIONS, "readwrite");
  tx.objectStore(STORE_SESSIONS).delete(clientId);
  await txDone(tx);
}

// ─────────────────────────── Cola de sync ───────────────────────────

/** Encola una operación de sincronización. */
export async function enqueueOperation(
  op: Omit<SyncOperation, "id">,
): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE_QUEUE, "readwrite");
  tx.objectStore(STORE_QUEUE).add(op);
  await txDone(tx);
}

/** Devuelve todas las operaciones pendientes en orden FIFO. */
export async function getQueue(): Promise<SyncOperation[]> {
  const db = await openDb();
  const tx = db.transaction(STORE_QUEUE, "readonly");
  const all = await promisify(
    tx.objectStore(STORE_QUEUE).getAll() as IDBRequest<SyncOperation[]>,
  );
  return all.sort((a, b) => a.createdAt - b.createdAt);
}

/** Elimina una operación de la cola por su id. */
export async function dequeueOperation(id: number): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE_QUEUE, "readwrite");
  tx.objectStore(STORE_QUEUE).delete(id);
  await txDone(tx);
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Transacción falló"));
    tx.onabort = () => reject(tx.error ?? new Error("Transacción abortada"));
  });
}
