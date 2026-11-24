"use client";

/**
 * Vektor — Hook de estado de sincronización.
 *
 * Expone si el dispositivo está online y cuántas operaciones quedan en la cola
 * de IndexedDB, para el indicador del dashboard y del tracker.
 */

import { useCallback, useEffect, useState } from "react";
import { getQueue } from "./db";
import { drainQueue } from "./sync-manager";

export interface SyncState {
  online: boolean;
  pending: number;
}

export function useSyncStatus(pollMs = 4000): SyncState {
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const queue = await getQueue();
      setPending(queue.length);
    } catch {
      // IndexedDB no disponible (SSR o modo privado): se ignora.
    }
  }, []);

  useEffect(() => {
    setOnline(typeof navigator !== "undefined" ? navigator.onLine : true);

    const goOnline = () => {
      setOnline(true);
      void drainQueue().then(() => refresh());
    };
    const goOffline = () => setOnline(false);

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    void refresh();
    const interval = setInterval(() => void refresh(), pollMs);

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      clearInterval(interval);
    };
  }, [refresh, pollMs]);

  return { online, pending };
}
