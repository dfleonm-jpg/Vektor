"use client";

/**
 * Vektor — Registrador del Service Worker + arranque de la cola de sync.
 *
 * Se monta una vez en el layout raíz. Registra /sw.js (scope raíz) e inicia el
 * auto-sync de la cola offline cuando vuelve la conexión.
 */

import { useEffect } from "react";
import { initAutoSync } from "../../lib/offline/sync-manager";

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("serviceWorker" in navigator) {
      const onLoad = () => {
        navigator.serviceWorker
          .register("/sw.js", { scope: "/" })
          .catch((err) => {
            console.error("[Vektor] Fallo al registrar el SW:", err);
          });
      };
      window.addEventListener("load", onLoad);
      initAutoSync();
      return () => window.removeEventListener("load", onLoad);
    }

    initAutoSync();
    return undefined;
  }, []);

  return null;
}

export default ServiceWorkerRegistrar;
