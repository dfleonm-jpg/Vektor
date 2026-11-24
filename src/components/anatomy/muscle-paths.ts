/**
 * Vektor — Trazados SVG de las zonas musculares.
 *
 * Silueta humana estilizada sobre un lienzo de 240×440. Cada grupo muscular
 * se define como uno o más trazados (lado izquierdo/derecho del cuerpo) para
 * que el relleno dinámico por rango se aplique a la zona completa.
 *
 * Las zonas son amplias y bien separadas para que sean fáciles de tocar en
 * móvil sin solapamientos incómodos. Los 14 grupos del catálogo tienen una
 * ubicación en la vista frontal y/o posterior según su anatomía.
 */

import type { MuscleGroup } from "../../lib/rank-config";

export type AnatomyView = "front" | "back";

export interface MuscleShape {
  /** Grupo muscular que representa esta forma. */
  group: MuscleGroup;
  /** Uno o más paths SVG (p. ej. izquierda y derecha del cuerpo). */
  paths: string[];
}

export const ANATOMY_VIEWBOX = "0 0 240 440";

/** Contorno de referencia del cuerpo (no interactivo), por vista. */
export const BODY_OUTLINE: Record<AnatomyView, string> = {
  front:
    "M120 14c-13 0-22 9-22 22 0 8 3 14 8 18-10 3-20 9-26 18-5 8-7 20-8 34-1 10-4 22-7 32-2 8 4 12 9 9 2 10 3 22 3 34 0 20-3 40-6 58-2 14-3 28-2 40 1 8 10 10 14 4 3 12 4 26 5 38 1 10 11 10 12 0 1-14 2-30 5-42 1-6 6-6 7 0 3 12 4 28 5 42 1 10 11 10 12 0 1-12 2-26 5-38 4 6 13 4 14-4 1-12 0-26-2-40-3-18-6-38-6-58 0-12 1-24 3-34 5 3 11-1 9-9-3-10-6-22-7-32-1-14-3-26-8-34-6-9-16-15-26-18 5-4 8-10 8-18 0-13-9-22-22-22z",
  back:
    "M120 14c-13 0-22 9-22 22 0 8 3 14 8 18-10 3-20 9-26 18-5 8-7 20-8 34-1 10-4 22-7 32-2 8 4 12 9 9 2 10 3 22 3 34 0 20-3 40-6 58-2 14-3 28-2 40 1 8 10 10 14 4 3 12 4 26 5 38 1 10 11 10 12 0 1-14 2-30 5-42 1-6 6-6 7 0 3 12 4 28 5 42 1 10 11 10 12 0 1-12 2-26 5-38 4 6 13 4 14-4 1-12 0-26-2-40-3-18-6-38-6-58 0-12 1-24 3-34 5 3 11-1 9-9-3-10-6-22-7-32-1-14-3-26-8-34-6-9-16-15-26-18 5-4 8-10 8-18 0-13-9-22-22-22z",
};

/** Zonas interactivas de la vista FRONTAL. */
export const FRONT_MUSCLES: MuscleShape[] = [
  {
    group: "FRONT_DELTS",
    paths: [
      "M86 96c-10 1-17 6-20 14 7 4 15 5 22 3 1-6 1-12-2-17z",
      "M154 96c10 1 17 6 20 14-7 4-15 5-22 3-1-6-1-12 2-17z",
    ],
  },
  {
    group: "CHEST",
    paths: [
      "M92 100c8-3 18-3 26 0 2 10 2 20-1 28-9 3-18 3-27 0-2-9-2-19 2-28z",
      "M148 100c-8-3-18-3-26 0-2 10-2 20 1 28 9 3 18 3 27 0 2-9 2-19-2-28z",
    ],
  },
  {
    group: "BICEPS",
    paths: [
      "M70 138c-6 2-9 10-9 20 0 8 2 15 5 20 4-2 6-6 7-12 1-10 0-20-3-28z",
      "M170 138c6 2 9 10 9 20 0 8-2 15-5 20-4-2-6-6-7-12-1-10 0-20 3-28z",
    ],
  },
  {
    group: "FOREARMS",
    paths: [
      "M62 180c-4 2-6 10-6 20 0 10 2 20 5 27 3-2 5-7 5-15 0-12-1-24-4-32z",
      "M178 180c4 2 6 10 6 20 0 10-2 20-5 27-3-2-5-7-5-15 0-12 1-24 4-32z",
    ],
  },
  {
    group: "CORE",
    paths: [
      "M104 134c11-2 21-2 32 0 2 14 2 30 0 44-3 6-9 10-16 10s-13-4-16-10c-2-14-2-30 0-44z",
    ],
  },
  {
    group: "QUADS",
    paths: [
      "M98 206c-6 10-8 26-8 42 0 14 2 28 6 40 5-2 8-8 9-18 2-20 1-44-7-64z",
      "M142 206c6 10 8 26 8 42 0 14-2 28-6 40-5-2-8-8-9-18-2-20-1-44 7-64z",
    ],
  },
  {
    group: "CALVES",
    paths: [
      "M96 300c-5 8-7 22-6 36 1 10 3 18 7 24 4-6 5-16 5-28 0-12-1-24-6-32z",
      "M144 300c5 8 7 22 6 36-1 10-3 18-7 24-4-6-5-16-5-28 0-12 1-24 6-32z",
    ],
  },
];

/** Zonas interactivas de la vista POSTERIOR. */
export const BACK_MUSCLES: MuscleShape[] = [
  {
    group: "UPPER_BACK",
    paths: [
      "M100 92c13-3 27-3 40 0 3 8 3 18 0 26-6 4-14 6-20 6s-14-2-20-6c-3-8-3-18 0-26z",
    ],
  },
  {
    group: "REAR_DELTS",
    paths: [
      "M84 98c-10 2-16 8-18 16 7 3 15 3 22 0 0-6-1-12-4-16z",
      "M156 98c10 2 16 8 18 16-7 3-15 3-22 0 0-6 1-12 4-16z",
    ],
  },
  {
    group: "LATS",
    paths: [
      "M92 126c8 0 15 3 19 9 3 14 2 30-2 42-7-2-13-7-16-15-3-12-3-24-1-36z",
      "M148 126c-8 0-15 3-19 9-3 14-2 30 2 42 7-2 13-7 16-15 3-12 3-24 1-36z",
    ],
  },
  {
    group: "TRICEPS",
    paths: [
      "M70 138c-6 2-9 10-9 20 0 8 2 15 5 20 4-2 6-6 7-12 1-10 0-20-3-28z",
      "M170 138c6 2 9 10 9 20 0 8-2 15-5 20-4-2-6-6-7-12-1-10 0-20 3-28z",
    ],
  },
  {
    group: "GLUTES",
    paths: [
      "M100 198c7-3 14-3 20 0 4 8 5 18 2 26-5 5-14 5-22 5s-17 0-22-5c-3-8-2-18 2-26 6-3 13-3 20 0z",
    ],
  },
  {
    group: "HAMSTRINGS",
    paths: [
      "M98 232c-6 10-8 24-8 40 0 12 2 24 6 34 5-2 8-8 9-18 2-20 1-40-7-56z",
      "M142 232c6 10 8 24 8 40 0 12-2 24-6 34-5-2-8-8-9-18-2-20-1-40 7-56z",
    ],
  },
  {
    group: "CALVES",
    paths: [
      "M96 300c-5 8-7 22-6 36 1 10 3 18 7 24 4-6 5-16 5-28 0-12-1-24-6-32z",
      "M144 300c5 8 7 22 6 36-1 10-3 18-7 24-4-6-5-16-5-28 0-12 1-24 6-32z",
    ],
  },
  {
    group: "FOREARMS",
    paths: [
      "M62 180c-4 2-6 10-6 20 0 10 2 20 5 27 3-2 5-7 5-15 0-12-1-24-4-32z",
      "M178 180c4 2 6 10 6 20 0 10-2 20-5 27-3-2-5-7-5-15 0-12 1-24 4-32z",
    ],
  },
  {
    group: "SIDE_DELTS",
    paths: [
      "M78 96c-8 1-13 6-15 13 6 3 13 3 19 1 0-5-1-10-4-14z",
      "M162 96c8 1 13 6 15 13-6 3-13 3-19 1 0-5 1-10 4-14z",
    ],
  },
];

export function musclesForView(view: AnatomyView): MuscleShape[] {
  return view === "front" ? FRONT_MUSCLES : BACK_MUSCLES;
}
