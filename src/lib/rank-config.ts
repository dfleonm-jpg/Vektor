/**
 * Vektor — Configuración de los 9 rangos competitivos.
 *
 * Fuente única de verdad para el orden de los rangos, su color de marca y
 * los sub-niveles. El motor de ranking (`ranking-engine.ts`) y el mapa
 * anatómico consumen este módulo para mantener coherencia visual y lógica.
 */

export const COMPETITIVE_RANKS = [
  "IRON",
  "BRONZE",
  "SILVER",
  "GOLD",
  "PLATINUM",
  "EMERALD",
  "DIAMOND",
  "MASTER",
  "SYMMETRIC",
] as const;

export type CompetitiveRank = (typeof COMPETITIVE_RANKS)[number];

export const SUB_TIERS = ["I", "II", "III"] as const;
export type SubTier = (typeof SUB_TIERS)[number];

export const MUSCLE_GROUPS = [
  "CHEST",
  "LATS",
  "UPPER_BACK",
  "FRONT_DELTS",
  "SIDE_DELTS",
  "REAR_DELTS",
  "BICEPS",
  "TRICEPS",
  "FOREARMS",
  "CORE",
  "QUADS",
  "HAMSTRINGS",
  "GLUTES",
  "CALVES",
] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export type LoadType =
  | "EXTERNAL"
  | "BODYWEIGHT_REPS"
  | "WEIGHTED_BODYWEIGHT"
  | "ISOMETRIC_HOLD";

/** Métrica base con la que un ejercicio evalúa el rango. */
export type RankMetric = "ratio" | "reps" | "seconds";

/**
 * Metadatos de presentación por rango: nombre legible, color hex principal
 * y (opcional) degradado para el rango tope.
 */
export interface RankMeta {
  rank: CompetitiveRank;
  label: string;
  color: string;
  /** Degradado opcional (solo Simétrico). */
  gradientTo?: string;
  /** Índice 0-8 en la jerarquía. */
  order: number;
}

export const RANK_META: Record<CompetitiveRank, RankMeta> = {
  IRON: { rank: "IRON", label: "Hierro", color: "#71717A", order: 0 },
  BRONZE: { rank: "BRONZE", label: "Bronce", color: "#B45309", order: 1 },
  SILVER: { rank: "SILVER", label: "Plata", color: "#CBD5E1", order: 2 },
  GOLD: { rank: "GOLD", label: "Oro", color: "#EAB308", order: 3 },
  PLATINUM: { rank: "PLATINUM", label: "Platino", color: "#2DD4BF", order: 4 },
  EMERALD: { rank: "EMERALD", label: "Esmeralda", color: "#10B981", order: 5 },
  DIAMOND: { rank: "DIAMOND", label: "Diamante", color: "#38BDF8", order: 6 },
  MASTER: { rank: "MASTER", label: "Maestro", color: "#A855F7", order: 7 },
  SYMMETRIC: {
    rank: "SYMMETRIC",
    label: "Simétrico",
    color: "#F43F5E",
    gradientTo: "#F59E0B",
    order: 8,
  },
};

/** Etiquetas legibles por grupo muscular (ES). */
export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  CHEST: "Pectoral",
  LATS: "Dorsal ancho",
  UPPER_BACK: "Trapecio / espalda alta",
  FRONT_DELTS: "Deltoides anterior",
  SIDE_DELTS: "Deltoides lateral",
  REAR_DELTS: "Deltoides posterior",
  BICEPS: "Bíceps",
  TRICEPS: "Tríceps",
  FOREARMS: "Antebrazo",
  CORE: "Core / abdomen",
  QUADS: "Cuádriceps",
  HAMSTRINGS: "Isquiotibiales",
  GLUTES: "Glúteos",
  CALVES: "Gemelos",
};

/**
 * Estructura de los umbrales de rango almacenados en
 * `Exercise.rankThresholdsJson`. Para cada uno de los 9 rangos se define el
 * valor mínimo de la métrica (`ratio`, `reps` o `seconds`) necesario para
 * alcanzar el nivel I de ese rango.
 */
export interface RankThresholds {
  metric: RankMetric;
  thresholds: Record<CompetitiveRank, number>;
}
