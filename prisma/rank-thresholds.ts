/**
 * Vektor — Generadores de umbrales de fuerza relativa para los 9 rangos.
 *
 * Cada ejercicio del catálogo almacena un objeto `RankThresholds` en
 * `Exercise.rankThresholdsJson`. Estos helpers construyen esos objetos a
 * partir de valores ancla reales (basados en tablas de fuerza relativa
 * estándar para atletas intermedios-avanzados), interpolando los 9 escalones.
 *
 * Los umbrales corresponden al valor mínimo para alcanzar el nivel I de cada
 * rango. Un ratio de 2.0 en press de banca, por ejemplo, significa levantar
 * el doble del peso corporal a 1RM.
 */

import type { CompetitiveRank, RankThresholds } from "../src/lib/rank-config";

const RANK_ORDER: CompetitiveRank[] = [
  "IRON",
  "BRONZE",
  "SILVER",
  "GOLD",
  "PLATINUM",
  "EMERALD",
  "DIAMOND",
  "MASTER",
  "SYMMETRIC",
];

/**
 * Construye umbrales interpolando geométricamente entre un valor de entrada
 * (Hierro I) y un valor tope (Simétrico I). La progresión geométrica refleja
 * que cada escalón de fuerza relativa es progresivamente más difícil.
 */
function buildThresholds(
  metric: RankThresholds["metric"],
  entry: number,
  top: number,
): RankThresholds {
  const steps = RANK_ORDER.length - 1;
  const ratio = Math.pow(top / entry, 1 / steps);
  const thresholds = {} as Record<CompetitiveRank, number>;
  RANK_ORDER.forEach((rank, i) => {
    const raw = entry * Math.pow(ratio, i);
    thresholds[rank] = roundMetric(metric, raw);
  });
  return { metric, thresholds };
}

function roundMetric(metric: RankThresholds["metric"], value: number): number {
  if (metric === "ratio") return Math.round(value * 1000) / 1000;
  // reps y seconds son enteros.
  return Math.round(value);
}

/** Umbrales por ratio de 1RM / peso corporal (carga externa o lastrada). */
export function ratioThresholds(entry: number, top: number): RankThresholds {
  return buildThresholds("ratio", entry, top);
}

/** Umbrales por repeticiones estrictas máximas (calistenia por reps). */
export function repThresholds(entry: number, top: number): RankThresholds {
  return buildThresholds("reps", entry, top);
}

/** Umbrales por segundos de isometría sostenida. */
export function secondThresholds(entry: number, top: number): RankThresholds {
  return buildThresholds("seconds", entry, top);
}
