/**
 * Vektor — Catálogo inicial de ejercicios (70 esenciales).
 *
 * Cubre barra, mancuernas, poleas, máquinas y calistenia/lastre. Cada entrada
 * define músculo primario, secundarios, equipamiento, tipo de carga y los
 * umbrales de fuerza relativa para los 9 rangos.
 *
 * Los umbrales por ratio están calibrados para hombre intermedio-avanzado;
 * el motor normaliza por peso corporal, de modo que escalan solos. Para
 * ejercicios de reps/isometría, los umbrales expresan reps estrictas o
 * segundos sostenidos.
 */

import {
  ratioThresholds,
  repThresholds,
  secondThresholds,
} from "./rank-thresholds";
import type { LoadType, MuscleGroup } from "../src/lib/rank-config";

export interface SeedExercise {
  name: string;
  slug: string;
  primaryMuscle: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: string;
  loadType: LoadType;
  rankThresholdsJson: ReturnType<
    typeof ratioThresholds | typeof repThresholds | typeof secondThresholds
  >;
  instructions: string;
}

// Atajos de legibilidad.
const r = ratioThresholds;
const reps = repThresholds;
const sec = secondThresholds;

export const EXERCISE_CATALOG: SeedExercise[] = [
  // ─────────────── PECTORAL (CHEST) ───────────────
  {
    name: "Press de banca con barra",
    slug: "barbell-bench-press",
    primaryMuscle: "CHEST",
    secondaryMuscles: ["FRONT_DELTS", "TRICEPS"],
    equipment: "barbell",
    loadType: "EXTERNAL",
    rankThresholdsJson: r(0.5, 2.0),
    instructions:
      "Retrae escápulas, pies firmes, baja la barra al esternón y empuja en línea recta sin rebote.",
  },
  {
    name: "Press inclinado con barra",
    slug: "incline-barbell-press",
    primaryMuscle: "CHEST",
    secondaryMuscles: ["FRONT_DELTS", "TRICEPS"],
    equipment: "barbell",
    loadType: "EXTERNAL",
    rankThresholdsJson: r(0.4, 1.7),
    instructions:
      "Banco a 30°. Baja la barra a la clavícula alta y empuja enfatizando el pectoral superior.",
  },
  {
    name: "Press de banca con mancuernas",
    slug: "dumbbell-bench-press",
    primaryMuscle: "CHEST",
    secondaryMuscles: ["FRONT_DELTS", "TRICEPS"],
    equipment: "dumbbell",
    loadType: "EXTERNAL",
    rankThresholdsJson: r(0.22, 0.95),
    instructions:
      "Ratio por mancuerna. Controla el rango completo y junta ligeramente arriba sin chocar.",
  },
  {
    name: "Aperturas con mancuernas",
    slug: "dumbbell-fly",
    primaryMuscle: "CHEST",
    secondaryMuscles: ["FRONT_DELTS"],
    equipment: "dumbbell",
    loadType: "EXTERNAL",
    rankThresholdsJson: r(0.1, 0.45),
    instructions:
      "Codos semiflexionados fijos. Abre en arco amplio sintiendo el estiramiento y cierra sin impulso.",
  },
  {
    name: "Cruce de poleas",
    slug: "cable-crossover",
    primaryMuscle: "CHEST",
    secondaryMuscles: ["FRONT_DELTS"],
    equipment: "cable",
    loadType: "EXTERNAL",
    rankThresholdsJson: r(0.12, 0.5),
    instructions:
      "Poleas altas. Cruza las manos al frente contrayendo el pectoral; controla la vuelta.",
  },
  {
    name: "Press en máquina de pecho",
    slug: "machine-chest-press",
    primaryMuscle: "CHEST",
    secondaryMuscles: ["FRONT_DELTS", "TRICEPS"],
    equipment: "machine",
    loadType: "EXTERNAL",
    rankThresholdsJson: r(0.4, 1.6),
    instructions:
      "Ajusta el asiento a la altura del pecho. Empuja sin bloquear de golpe y controla el retorno.",
  },
  {
    name: "Flexiones lastradas",
    slug: "weighted-push-up",
    primaryMuscle: "CHEST",
    secondaryMuscles: ["FRONT_DELTS", "TRICEPS", "CORE"],
    equipment: "bodyweight",
    loadType: "WEIGHTED_BODYWEIGHT",
    rankThresholdsJson: r(1.0, 1.6),
    instructions:
      "Cuerpo rígido en plancha, lastre sobre la espalda alta. Baja el pecho casi al suelo y empuja.",
  },

  // ─────────────── DORSAL ANCHO (LATS) ───────────────
  {
    name: "Dominadas",
    slug: "pull-up",
    primaryMuscle: "LATS",
    secondaryMuscles: ["BICEPS", "UPPER_BACK", "FOREARMS"],
    equipment: "bodyweight",
    loadType: "BODYWEIGHT_REPS",
    rankThresholdsJson: reps(1, 30),
    instructions:
      "Agarre prono a la anchura de hombros. Lleva el pecho a la barra sin balanceo y baja controlado.",
  },
  {
    name: "Dominadas lastradas",
    slug: "weighted-pull-up",
    primaryMuscle: "LATS",
    secondaryMuscles: ["BICEPS", "UPPER_BACK", "FOREARMS"],
    equipment: "bodyweight",
    loadType: "WEIGHTED_BODYWEIGHT",
    rankThresholdsJson: r(1.05, 1.75),
    instructions:
      "Lastre en cinturón. Rango completo desde brazos extendidos; evita el kipping.",
  },
  {
    name: "Jalón al pecho en polea",
    slug: "lat-pulldown",
    primaryMuscle: "LATS",
    secondaryMuscles: ["BICEPS", "UPPER_BACK"],
    equipment: "cable",
    loadType: "EXTERNAL",
    rankThresholdsJson: r(0.5, 1.5),
    instructions:
      "Pecho alto, lleva la barra a la clavícula deprimiendo las escápulas. Controla la subida.",
  },
  {
    name: "Remo con barra",
    slug: "barbell-row",
    primaryMuscle: "LATS",
    secondaryMuscles: ["UPPER_BACK", "BICEPS", "REAR_DELTS"],
    equipment: "barbell",
    loadType: "EXTERNAL",
    rankThresholdsJson: r(0.5, 1.6),
    instructions:
      "Torso a ~45°, espalda neutra. Tira de la barra al abdomen bajo juntando omóplatos.",
  },
  {
    name: "Remo con mancuerna a una mano",
    slug: "one-arm-dumbbell-row",
    primaryMuscle: "LATS",
    secondaryMuscles: ["UPPER_BACK", "BICEPS"],
    equipment: "dumbbell",
    loadType: "EXTERNAL",
    rankThresholdsJson: r(0.25, 0.9),
    instructions:
      "Apoya rodilla y mano en el banco. Tira de la mancuerna a la cadera sin rotar el torso.",
  },
  {
    name: "Remo en polea sentado",
    slug: "seated-cable-row",
    primaryMuscle: "LATS",
    secondaryMuscles: ["UPPER_BACK", "BICEPS", "REAR_DELTS"],
    equipment: "cable",
    loadType: "EXTERNAL",
    rankThresholdsJson: r(0.5, 1.5),
    instructions:
      "Espalda erguida. Tira al ombligo retrayendo escápulas y vuelve en estiramiento controlado.",
  },
  {
    name: "Pullover con mancuerna",
    slug: "dumbbell-pullover",
    primaryMuscle: "LATS",
    secondaryMuscles: ["CHEST", "TRICEPS"],
    equipment: "dumbbell",
    loadType: "EXTERNAL",
    rankThresholdsJson: r(0.2, 0.75),
    instructions:
      "Tumbado perpendicular al banco. Baja la mancuerna tras la cabeza en arco y recupera con el dorsal.",
  },
  {
    name: "Muscle-up",
    slug: "muscle-up",
    primaryMuscle: "LATS",
    secondaryMuscles: ["CHEST", "TRICEPS", "UPPER_BACK", "CORE"],
    equipment: "bodyweight",
    loadType: "BODYWEIGHT_REPS",
    rankThresholdsJson: reps(1, 15),
    instructions:
      "Tirón explosivo, transición de muñeca sobre la barra y empuje a bloqueo. Repeticiones estrictas.",
  },

  // ─────────────── TRAPECIO / ESPALDA ALTA (UPPER_BACK) ───────────────
  {
    name: "Encogimientos con barra",
    slug: "barbell-shrug",
    primaryMuscle: "UPPER_BACK",
    secondaryMuscles: ["FOREARMS"],
    equipment: "barbell",
    loadType: "EXTERNAL",
    rankThresholdsJson: r(0.8, 2.6),
    instructions:
      "Eleva los hombros hacia las orejas sin rotar. Mantén un segundo arriba y baja controlado.",
  },
  {
    name: "Face pull en polea",
    slug: "face-pull",
    primaryMuscle: "UPPER_BACK",
    secondaryMuscles: ["REAR_DELTS", "BICEPS"],
    equipment: "cable",
    loadType: "EXTERNAL",
    rankThresholdsJson: r(0.15, 0.6),
    instructions:
      "Cuerda a la altura de la cara. Tira hacia la frente abriendo los codos y rotando externamente.",
  },
  {
    name: "Remo al mentón con barra",
    slug: "upright-row",
    primaryMuscle: "UPPER_BACK",
    secondaryMuscles: ["SIDE_DELTS", "BICEPS"],
    equipment: "barbell",
    loadType: "EXTERNAL",
    rankThresholdsJson: r(0.3, 1.0),
    instructions:
      "Agarre medio. Sube la barra al pecho con los codos altos y baja controlado sin impulso.",
  },
  {
    name: "Encogimientos con mancuernas",
    slug: "dumbbell-shrug",
    primaryMuscle: "UPPER_BACK",
    secondaryMuscles: ["FOREARMS"],
    equipment: "dumbbell",
    loadType: "EXTERNAL",
    rankThresholdsJson: r(0.4, 1.3),
    instructions:
      "Ratio por mancuerna. Eleva los hombros verticalmente y evita balancear los brazos.",
  },

  // ─────────────── DELTOIDES ANTERIOR (FRONT_DELTS) ───────────────
  {
    name: "Press militar con barra",
    slug: "overhead-press",
    primaryMuscle: "FRONT_DELTS",
    secondaryMuscles: ["SIDE_DELTS", "TRICEPS", "UPPER_BACK"],
    equipment: "barbell",
    loadType: "EXTERNAL",
    rankThresholdsJson: r(0.4, 1.4),
    instructions:
      "De pie, glúteos y abdomen firmes. Empuja la barra sobre la cabeza y mete la cabeza al final.",
  },
  {
    name: "Press de hombro con mancuernas",
    slug: "dumbbell-shoulder-press",
    primaryMuscle: "FRONT_DELTS",
    secondaryMuscles: ["SIDE_DELTS", "TRICEPS"],
    equipment: "dumbbell",
    loadType: "EXTERNAL",
    rankThresholdsJson: r(0.18, 0.7),
    instructions:
      "Ratio por mancuerna. Empuja hasta casi extender sin chocar y controla la bajada a la oreja.",
  },
  {
    name: "Elevaciones frontales",
    slug: "front-raise",
    primaryMuscle: "FRONT_DELTS",
    secondaryMuscles: [],
    equipment: "dumbbell",
    loadType: "EXTERNAL",
    rankThresholdsJson: r(0.08, 0.35),
    instructions:
      "Sube la mancuerna al frente hasta la altura de los ojos sin balanceo y baja controlada.",
  },

  // ─────────────── DELTOIDES LATERAL (SIDE_DELTS) ───────────────
  {
    name: "Elevaciones laterales",
    slug: "lateral-raise",
    primaryMuscle: "SIDE_DELTS",
    secondaryMuscles: [],
    equipment: "dumbbell",
    loadType: "EXTERNAL",
    rankThresholdsJson: r(0.08, 0.35),
    instructions:
      "Codos ligeramente flexionados. Abre hasta la horizontal guiando con los codos, sin trapecio.",
  },
  {
    name: "Elevaciones laterales en polea",
    slug: "cable-lateral-raise",
    primaryMuscle: "SIDE_DELTS",
    secondaryMuscles: [],
    equipment: "cable",
    loadType: "EXTERNAL",
    rankThresholdsJson: r(0.08, 0.35),
    instructions:
      "Polea baja cruzada por detrás. Tensión constante; eleva a la horizontal y controla la vuelta.",
  },
  {
    name: "Elevaciones laterales en máquina",
    slug: "machine-lateral-raise",
    primaryMuscle: "SIDE_DELTS",
    secondaryMuscles: [],
    equipment: "machine",
    loadType: "EXTERNAL",
    rankThresholdsJson: r(0.25, 0.9),
    instructions:
      "Codos contra las almohadillas. Empuja hacia afuera y arriba; aprieta un instante en el tope.",
  },

  // ─────────────── DELTOIDES POSTERIOR (REAR_DELTS) ───────────────
  {
    name: "Pájaros con mancuernas",
    slug: "rear-delt-fly",
    primaryMuscle: "REAR_DELTS",
    secondaryMuscles: ["UPPER_BACK"],
    equipment: "dumbbell",
    loadType: "EXTERNAL",
    rankThresholdsJson: r(0.07, 0.3),
    instructions:
      "Torso inclinado al frente. Abre en arco llevando las mancuernas atrás sin encoger el trapecio.",
  },
  {
    name: "Pájaro en máquina (peck-deck inverso)",
    slug: "reverse-pec-deck",
    primaryMuscle: "REAR_DELTS",
    secondaryMuscles: ["UPPER_BACK"],
    equipment: "machine",
    loadType: "EXTERNAL",
    rankThresholdsJson: r(0.2, 0.75),
    instructions:
      "Pecho contra la almohadilla. Abre los brazos hacia atrás apretando el deltoides posterior.",
  },

  // ─────────────── BÍCEPS ───────────────
  {
    name: "Curl de bíceps con barra",
    slug: "barbell-curl",
    primaryMuscle: "BICEPS",
    secondaryMuscles: ["FOREARMS"],
    equipment: "barbell",
    loadType: "EXTERNAL",
    rankThresholdsJson: r(0.3, 1.0),
    instructions:
      "Codos pegados al torso. Flexiona sin balancear y baja controlando el estiramiento completo.",
  },
  {
    name: "Curl con mancuernas alternado",
    slug: "dumbbell-curl",
    primaryMuscle: "BICEPS",
    secondaryMuscles: ["FOREARMS"],
    equipment: "dumbbell",
    loadType: "EXTERNAL",
    rankThresholdsJson: r(0.12, 0.45),
    instructions:
      "Ratio por mancuerna. Supina al subir, aprieta arriba y baja sin impulso de hombro.",
  },
  {
    name: "Curl martillo",
    slug: "hammer-curl",
    primaryMuscle: "BICEPS",
    secondaryMuscles: ["FOREARMS"],
    equipment: "dumbbell",
    loadType: "EXTERNAL",
    rankThresholdsJson: r(0.12, 0.48),
    instructions:
      "Agarre neutro todo el recorrido. Trabaja braquial y braquiorradial; sube y baja controlado.",
  },
  {
    name: "Curl en polea",
    slug: "cable-curl",
    primaryMuscle: "BICEPS",
    secondaryMuscles: ["FOREARMS"],
    equipment: "cable",
    loadType: "EXTERNAL",
    rankThresholdsJson: r(0.25, 0.9),
    instructions:
      "Polea baja con tensión constante. Flexiona sin mover los codos y resiste la fase excéntrica.",
  },
  {
    name: "Curl predicador",
    slug: "preacher-curl",
    primaryMuscle: "BICEPS",
    secondaryMuscles: ["FOREARMS"],
    equipment: "machine",
    loadType: "EXTERNAL",
    rankThresholdsJson: r(0.25, 0.85),
    instructions:
      "Brazos fijos sobre el banco inclinado. Sube sin despegar los codos y baja en estiramiento total.",
  },
  {
    name: "Curl de bíceps en dominada supina (chin-up)",
    slug: "chin-up",
    primaryMuscle: "BICEPS",
    secondaryMuscles: ["LATS", "FOREARMS"],
    equipment: "bodyweight",
    loadType: "BODYWEIGHT_REPS",
    rankThresholdsJson: reps(1, 25),
    instructions:
      "Agarre supino estrecho. Tira con el bíceps llevando la barbilla sobre la barra; sin balanceo.",
  },

  // ─────────────── TRÍCEPS ───────────────
  {
    name: "Press de banca cerrado",
    slug: "close-grip-bench-press",
    primaryMuscle: "TRICEPS",
    secondaryMuscles: ["CHEST", "FRONT_DELTS"],
    equipment: "barbell",
    loadType: "EXTERNAL",
    rankThresholdsJson: r(0.45, 1.6),
    instructions:
      "Manos a la anchura de hombros. Codos cerca del torso; empuja enfatizando el tríceps.",
  },
  {
    name: "Extensión de tríceps en polea",
    slug: "triceps-pushdown",
    primaryMuscle: "TRICEPS",
    secondaryMuscles: [],
    equipment: "cable",
    loadType: "EXTERNAL",
    rankThresholdsJson: r(0.3, 1.0),
    instructions:
      "Codos pegados. Extiende por completo hasta sentir el tríceps y vuelve controlado.",
  },
  {
    name: "Press francés",
    slug: "skull-crusher",
    primaryMuscle: "TRICEPS",
    secondaryMuscles: [],
    equipment: "barbell",
    loadType: "EXTERNAL",
    rankThresholdsJson: r(0.25, 0.85),
    instructions:
      "Tumbado, baja la barra hacia la frente flexionando solo los codos y extiende sin moverlos.",
  },
  {
    name: "Fondos en paralelas",
    slug: "parallel-bar-dip",
    primaryMuscle: "TRICEPS",
    secondaryMuscles: ["CHEST", "FRONT_DELTS"],
    equipment: "bodyweight",
    loadType: "BODYWEIGHT_REPS",
    rankThresholdsJson: reps(1, 35),
    instructions:
      "Torso vertical para tríceps. Baja hasta ~90° de codo y empuja a bloqueo sin balanceo.",
  },
  {
    name: "Fondos lastrados",
    slug: "weighted-dip",
    primaryMuscle: "TRICEPS",
    secondaryMuscles: ["CHEST", "FRONT_DELTS"],
    equipment: "bodyweight",
    loadType: "WEIGHTED_BODYWEIGHT",
    rankThresholdsJson: r(1.1, 1.9),
    instructions:
      "Lastre en cinturón. Controla el rango completo manteniendo tensión en el tríceps.",
  },
  {
    name: "Extensión de tríceps sobre la cabeza",
    slug: "overhead-triceps-extension",
    primaryMuscle: "TRICEPS",
    secondaryMuscles: [],
    equipment: "dumbbell",
    loadType: "EXTERNAL",
    rankThresholdsJson: r(0.15, 0.55),
    instructions:
      "Mancuerna sobre la cabeza con ambas manos. Baja tras la nuca y extiende sintiendo la cabeza larga.",
  },

  // ─────────────── ANTEBRAZO (FOREARMS) ───────────────
  {
    name: "Curl de muñeca con barra",
    slug: "wrist-curl",
    primaryMuscle: "FOREARMS",
    secondaryMuscles: [],
    equipment: "barbell",
    loadType: "EXTERNAL",
    rankThresholdsJson: r(0.3, 1.1),
    instructions:
      "Antebrazos apoyados, muñecas fuera del banco. Flexiona las muñecas con rango completo.",
  },
  {
    name: "Curl de muñeca inverso",
    slug: "reverse-wrist-curl",
    primaryMuscle: "FOREARMS",
    secondaryMuscles: [],
    equipment: "barbell",
    loadType: "EXTERNAL",
    rankThresholdsJson: r(0.15, 0.6),
    instructions:
      "Agarre prono. Extiende las muñecas hacia arriba trabajando los extensores del antebrazo.",
  },
  {
    name: "Suspensión en barra (dead hang)",
    slug: "dead-hang",
    primaryMuscle: "FOREARMS",
    secondaryMuscles: ["LATS"],
    equipment: "bodyweight",
    loadType: "ISOMETRIC_HOLD",
    rankThresholdsJson: sec(20, 180),
    instructions:
      "Cuelga de la barra con agarre firme, hombros activos. Mide los segundos de suspensión total.",
  },

  // ─────────────── CORE / ABDOMEN ───────────────
  {
    name: "Plancha abdominal",
    slug: "plank",
    primaryMuscle: "CORE",
    secondaryMuscles: ["FRONT_DELTS"],
    equipment: "bodyweight",
    loadType: "ISOMETRIC_HOLD",
    rankThresholdsJson: sec(30, 300),
    instructions:
      "Antebrazos y pies. Cuerpo en línea, glúteos y abdomen apretados; sin hundir la cadera.",
  },
  {
    name: "L-sit",
    slug: "l-sit",
    primaryMuscle: "CORE",
    secondaryMuscles: ["TRICEPS", "QUADS"],
    equipment: "bodyweight",
    loadType: "ISOMETRIC_HOLD",
    rankThresholdsJson: sec(5, 60),
    instructions:
      "En paralelas o suelo. Piernas rectas paralelas al suelo, hombros deprimidos. Mide segundos.",
  },
  {
    name: "Elevaciones de piernas colgado",
    slug: "hanging-leg-raise",
    primaryMuscle: "CORE",
    secondaryMuscles: ["FOREARMS"],
    equipment: "bodyweight",
    loadType: "BODYWEIGHT_REPS",
    rankThresholdsJson: reps(3, 30),
    instructions:
      "Colgado sin balanceo. Sube las piernas rectas hasta la horizontal o más y baja controlado.",
  },
  {
    name: "Rueda abdominal (ab wheel)",
    slug: "ab-wheel-rollout",
    primaryMuscle: "CORE",
    secondaryMuscles: ["LATS", "FRONT_DELTS"],
    equipment: "bodyweight",
    loadType: "BODYWEIGHT_REPS",
    rankThresholdsJson: reps(3, 25),
    instructions:
      "Desde rodillas o pies. Rueda al frente manteniendo el abdomen firme sin arquear la lumbar.",
  },
  {
    name: "Crunch en polea",
    slug: "cable-crunch",
    primaryMuscle: "CORE",
    secondaryMuscles: [],
    equipment: "cable",
    loadType: "EXTERNAL",
    rankThresholdsJson: r(0.3, 1.1),
    instructions:
      "De rodillas con cuerda tras la nuca. Flexiona el tronco llevando los codos a los muslos.",
  },
  {
    name: "Front lever",
    slug: "front-lever",
    primaryMuscle: "CORE",
    secondaryMuscles: ["LATS", "UPPER_BACK"],
    equipment: "bodyweight",
    loadType: "ISOMETRIC_HOLD",
    rankThresholdsJson: sec(2, 30),
    instructions:
      "Cuerpo horizontal y recto colgado de la barra, brazos extendidos. Mide los segundos sostenidos.",
  },

  // ─────────────── CUÁDRICEPS (QUADS) ───────────────
  {
    name: "Sentadilla con barra",
    slug: "back-squat",
    primaryMuscle: "QUADS",
    secondaryMuscles: ["GLUTES", "HAMSTRINGS", "CORE"],
    equipment: "barbell",
    loadType: "EXTERNAL",
    rankThresholdsJson: r(0.75, 2.5),
    instructions:
      "Barra en el trapecio. Baja hasta romper paralela con la espalda neutra y sube con fuerza.",
  },
  {
    name: "Sentadilla frontal",
    slug: "front-squat",
    primaryMuscle: "QUADS",
    secondaryMuscles: ["GLUTES", "CORE"],
    equipment: "barbell",
    loadType: "EXTERNAL",
    rankThresholdsJson: r(0.6, 2.0),
    instructions:
      "Barra sobre los deltoides frontales, codos altos. Mantén el torso vertical en todo el rango.",
  },
  {
    name: "Prensa de piernas",
    slug: "leg-press",
    primaryMuscle: "QUADS",
    secondaryMuscles: ["GLUTES", "HAMSTRINGS"],
    equipment: "machine",
    loadType: "EXTERNAL",
    rankThresholdsJson: r(1.5, 5.0),
    instructions:
      "Pies a la anchura de hombros. Baja hasta ~90° sin despegar la lumbar y empuja sin bloquear.",
  },
  {
    name: "Extensión de cuádriceps",
    slug: "leg-extension",
    primaryMuscle: "QUADS",
    secondaryMuscles: [],
    equipment: "machine",
    loadType: "EXTERNAL",
    rankThresholdsJson: r(0.4, 1.5),
    instructions:
      "Rodillo sobre el empeine. Extiende por completo apretando el cuádriceps y baja controlado.",
  },
  {
    name: "Zancadas con mancuernas",
    slug: "dumbbell-lunge",
    primaryMuscle: "QUADS",
    secondaryMuscles: ["GLUTES", "HAMSTRINGS"],
    equipment: "dumbbell",
    loadType: "EXTERNAL",
    rankThresholdsJson: r(0.3, 1.1),
    instructions:
      "Ratio por mancuerna. Da un paso largo, baja la rodilla trasera casi al suelo y empuja al frente.",
  },
  {
    name: "Sentadilla búlgara",
    slug: "bulgarian-split-squat",
    primaryMuscle: "QUADS",
    secondaryMuscles: ["GLUTES", "HAMSTRINGS"],
    equipment: "dumbbell",
    loadType: "EXTERNAL",
    rankThresholdsJson: r(0.3, 1.1),
    instructions:
      "Pie trasero elevado en banco. Baja vertical sobre la pierna delantera y sube sin impulso.",
  },
  {
    name: "Sentadilla con peso corporal (pistol squat)",
    slug: "pistol-squat",
    primaryMuscle: "QUADS",
    secondaryMuscles: ["GLUTES", "CORE"],
    equipment: "bodyweight",
    loadType: "BODYWEIGHT_REPS",
    rankThresholdsJson: reps(1, 20),
    instructions:
      "A una pierna, la otra extendida al frente. Baja controlado hasta abajo y sube sin apoyo.",
  },

  // ─────────────── ISQUIOTIBIALES (HAMSTRINGS) ───────────────
  {
    name: "Peso muerto convencional",
    slug: "deadlift",
    primaryMuscle: "HAMSTRINGS",
    secondaryMuscles: ["GLUTES", "LATS", "UPPER_BACK", "FOREARMS"],
    equipment: "barbell",
    loadType: "EXTERNAL",
    rankThresholdsJson: r(1.0, 3.0),
    instructions:
      "Barra sobre el mediopié. Espalda neutra, empuja el suelo y extiende cadera y rodilla a la vez.",
  },
  {
    name: "Peso muerto rumano",
    slug: "romanian-deadlift",
    primaryMuscle: "HAMSTRINGS",
    secondaryMuscles: ["GLUTES", "LATS"],
    equipment: "barbell",
    loadType: "EXTERNAL",
    rankThresholdsJson: r(0.75, 2.4),
    instructions:
      "Rodillas semiflexionadas fijas. Lleva la cadera atrás bajando la barra pegada a las piernas.",
  },
  {
    name: "Curl femoral tumbado",
    slug: "lying-leg-curl",
    primaryMuscle: "HAMSTRINGS",
    secondaryMuscles: ["CALVES"],
    equipment: "machine",
    loadType: "EXTERNAL",
    rankThresholdsJson: r(0.35, 1.3),
    instructions:
      "Rodillo sobre el tendón de Aquiles. Flexiona la rodilla llevando el talón al glúteo; baja lento.",
  },
  {
    name: "Curl femoral sentado",
    slug: "seated-leg-curl",
    primaryMuscle: "HAMSTRINGS",
    secondaryMuscles: ["CALVES"],
    equipment: "machine",
    loadType: "EXTERNAL",
    rankThresholdsJson: r(0.4, 1.4),
    instructions:
      "Muslos fijos bajo la almohadilla. Flexiona las rodillas con rango completo y controla el retorno.",
  },
  {
    name: "Nordic curl",
    slug: "nordic-hamstring-curl",
    primaryMuscle: "HAMSTRINGS",
    secondaryMuscles: ["GLUTES"],
    equipment: "bodyweight",
    loadType: "BODYWEIGHT_REPS",
    rankThresholdsJson: reps(1, 15),
    instructions:
      "Tobillos anclados. Baja el tronco lento resistiendo con los isquios y vuelve con mínimo impulso.",
  },

  // ─────────────── GLÚTEOS (GLUTES) ───────────────
  {
    name: "Hip thrust con barra",
    slug: "hip-thrust",
    primaryMuscle: "GLUTES",
    secondaryMuscles: ["HAMSTRINGS", "QUADS"],
    equipment: "barbell",
    loadType: "EXTERNAL",
    rankThresholdsJson: r(1.0, 3.0),
    instructions:
      "Espalda alta en el banco, barra en la cadera. Extiende la cadera apretando glúteos arriba.",
  },
  {
    name: "Puente de glúteo",
    slug: "glute-bridge",
    primaryMuscle: "GLUTES",
    secondaryMuscles: ["HAMSTRINGS"],
    equipment: "barbell",
    loadType: "EXTERNAL",
    rankThresholdsJson: r(0.9, 2.8),
    instructions:
      "Tumbado en el suelo, barra en la cadera. Eleva la pelvis hasta la extensión completa.",
  },
  {
    name: "Patada de glúteo en polea",
    slug: "cable-kickback",
    primaryMuscle: "GLUTES",
    secondaryMuscles: ["HAMSTRINGS"],
    equipment: "cable",
    loadType: "EXTERNAL",
    rankThresholdsJson: r(0.15, 0.6),
    instructions:
      "Tobillera en polea baja. Lleva la pierna atrás extendiendo la cadera sin arquear la lumbar.",
  },
  {
    name: "Abducción de cadera en máquina",
    slug: "hip-abduction",
    primaryMuscle: "GLUTES",
    secondaryMuscles: [],
    equipment: "machine",
    loadType: "EXTERNAL",
    rankThresholdsJson: r(0.4, 1.4),
    instructions:
      "Sentado, abre las piernas contra las almohadillas apretando el glúteo medio; vuelve lento.",
  },

  // ─────────────── GEMELOS (CALVES) ───────────────
  {
    name: "Elevación de talones de pie",
    slug: "standing-calf-raise",
    primaryMuscle: "CALVES",
    secondaryMuscles: [],
    equipment: "machine",
    loadType: "EXTERNAL",
    rankThresholdsJson: r(0.6, 2.2),
    instructions:
      "Metatarsos en el escalón. Sube al máximo sobre las puntas y baja hasta estirar el gemelo.",
  },
  {
    name: "Elevación de talones sentado",
    slug: "seated-calf-raise",
    primaryMuscle: "CALVES",
    secondaryMuscles: [],
    equipment: "machine",
    loadType: "EXTERNAL",
    rankThresholdsJson: r(0.4, 1.6),
    instructions:
      "Rodillas flexionadas bajo la almohadilla para aislar el sóleo. Rango completo y pausa arriba.",
  },
  {
    name: "Elevación de talones en prensa",
    slug: "leg-press-calf-raise",
    primaryMuscle: "CALVES",
    secondaryMuscles: [],
    equipment: "machine",
    loadType: "EXTERNAL",
    rankThresholdsJson: r(1.0, 3.5),
    instructions:
      "Metatarsos en el borde de la plataforma. Empuja con las puntas extendiendo el tobillo al máximo.",
  },
  {
    name: "Elevación de talón a una pierna",
    slug: "single-leg-calf-raise",
    primaryMuscle: "CALVES",
    secondaryMuscles: [],
    equipment: "bodyweight",
    loadType: "BODYWEIGHT_REPS",
    rankThresholdsJson: reps(5, 40),
    instructions:
      "Sobre una pierna en un escalón. Sube al máximo y baja estirando; repeticiones estrictas sin rebote.",
  },

  // ─────────────── COMPUESTOS / HÍBRIDOS EXTRA ───────────────
  {
    name: "Clean and press (cargada y press)",
    slug: "clean-and-press",
    primaryMuscle: "FRONT_DELTS",
    secondaryMuscles: ["QUADS", "UPPER_BACK", "TRICEPS", "CORE"],
    equipment: "barbell",
    loadType: "EXTERNAL",
    rankThresholdsJson: r(0.4, 1.4),
    instructions:
      "Cargada explosiva a los hombros y press sobre la cabeza en un movimiento coordinado.",
  },
  {
    name: "Remo invertido",
    slug: "inverted-row",
    primaryMuscle: "UPPER_BACK",
    secondaryMuscles: ["LATS", "BICEPS"],
    equipment: "bodyweight",
    loadType: "BODYWEIGHT_REPS",
    rankThresholdsJson: reps(5, 40),
    instructions:
      "Barra a la altura de la cadera, cuerpo rígido. Tira del pecho a la barra y baja controlado.",
  },
  {
    name: "Flexiones estrictas",
    slug: "push-up",
    primaryMuscle: "CHEST",
    secondaryMuscles: ["TRICEPS", "FRONT_DELTS", "CORE"],
    equipment: "bodyweight",
    loadType: "BODYWEIGHT_REPS",
    rankThresholdsJson: reps(5, 60),
    instructions:
      "Cuerpo en plancha. Baja el pecho casi al suelo y empuja a bloqueo; sin hundir la cadera.",
  },
  {
    name: "Sentadilla goblet",
    slug: "goblet-squat",
    primaryMuscle: "QUADS",
    secondaryMuscles: ["GLUTES", "CORE"],
    equipment: "dumbbell",
    loadType: "EXTERNAL",
    rankThresholdsJson: r(0.3, 1.2),
    instructions:
      "Mancuerna al pecho con ambas manos. Baja entre las rodillas con el torso erguido y sube.",
  },
  {
    name: "Peso muerto con mancuernas",
    slug: "dumbbell-deadlift",
    primaryMuscle: "HAMSTRINGS",
    secondaryMuscles: ["GLUTES", "UPPER_BACK", "FOREARMS"],
    equipment: "dumbbell",
    loadType: "EXTERNAL",
    rankThresholdsJson: r(0.4, 1.4),
    instructions:
      "Ratio por mancuerna. Bisagra de cadera con espalda neutra, mancuernas pegadas a las piernas.",
  },
  {
    name: "Remo en punta (T-bar row)",
    slug: "t-bar-row",
    primaryMuscle: "LATS",
    secondaryMuscles: ["UPPER_BACK", "BICEPS", "REAR_DELTS"],
    equipment: "barbell",
    loadType: "EXTERNAL",
    rankThresholdsJson: r(0.5, 1.7),
    instructions:
      "Torso inclinado, espalda neutra. Tira del agarre al abdomen juntando omóplatos y baja controlado.",
  },
  {
    name: "Press Arnold",
    slug: "arnold-press",
    primaryMuscle: "FRONT_DELTS",
    secondaryMuscles: ["SIDE_DELTS", "TRICEPS"],
    equipment: "dumbbell",
    loadType: "EXTERNAL",
    rankThresholdsJson: r(0.15, 0.6),
    instructions:
      "Ratio por mancuerna. Rota de palmas al cuerpo a palmas al frente mientras empujas arriba.",
  },
  {
    name: "Curl concentrado",
    slug: "concentration-curl",
    primaryMuscle: "BICEPS",
    secondaryMuscles: ["FOREARMS"],
    equipment: "dumbbell",
    loadType: "EXTERNAL",
    rankThresholdsJson: r(0.1, 0.4),
    instructions:
      "Codo apoyado en el muslo interior. Flexiona con contracción máxima y baja en estiramiento total.",
  },
  {
    name: "Extensión de tríceps en polea tras nuca",
    slug: "overhead-cable-extension",
    primaryMuscle: "TRICEPS",
    secondaryMuscles: [],
    equipment: "cable",
    loadType: "EXTERNAL",
    rankThresholdsJson: r(0.25, 0.9),
    instructions:
      "De espaldas a la polea, cuerda sobre la cabeza. Extiende los codos al frente y controla la vuelta.",
  },
  {
    name: "Encogimiento abdominal declinado",
    slug: "decline-crunch",
    primaryMuscle: "CORE",
    secondaryMuscles: [],
    equipment: "bodyweight",
    loadType: "BODYWEIGHT_REPS",
    rankThresholdsJson: reps(8, 50),
    instructions:
      "En banco declinado. Flexiona el tronco llevando el esternón a la pelvis sin tirar del cuello.",
  },
  {
    name: "Elevación de rodillas en paralelas (captain's chair)",
    slug: "captains-chair-knee-raise",
    primaryMuscle: "CORE",
    secondaryMuscles: [],
    equipment: "bodyweight",
    loadType: "BODYWEIGHT_REPS",
    rankThresholdsJson: reps(8, 40),
    instructions:
      "Antebrazos apoyados, espalda contra el respaldo. Sube las rodillas al pecho sin balanceo.",
  },
];
