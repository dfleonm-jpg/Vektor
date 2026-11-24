"use client";

/**
 * Vektor — Indicador de estado de sincronización.
 *
 * Online / Offline y nº de operaciones pendientes en la cola de IndexedDB.
 * Sutil pero siempre visible, para dar confianza de que nada se pierde.
 */

export interface SyncBadgeProps {
  online: boolean;
  pending: number;
}

export function SyncBadge({ online, pending }: SyncBadgeProps) {
  const color = !online ? "#A1A1AA" : pending > 0 ? "#EAB308" : "#10B981";
  const label = !online
    ? "Offline"
    : pending > 0
      ? `${pending} en cola`
      : "Sincronizado";

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs"
      style={{ borderColor: `${color}55`, color }}
      aria-label={`Estado de sincronización: ${label}`}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

export default SyncBadge;
